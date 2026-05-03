/** 通知中心 service：负责消息列表、偏好管理和多渠道路由编排。 */
import { BadRequestException, Inject, Injectable, OnModuleInit } from "@nestjs/common";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { JobQueueService, type BackgroundJobHandler } from "@/common/job-queue/job-queue.service";
import { toIsoString } from "@/common/mappers/date-time.mapper";
import { ListNotificationRecordsDto } from "./dto/list-notification-records.dto";
import { UpsertNotificationPreferencesDto } from "./dto/upsert-notification-preferences.dto";
import {
  mapNotificationPreference,
  mapNotificationRecord
} from "./mappers/notification-center.mapper";
import {
  NOTIFICATION_CHANNEL_ADAPTERS,
  type NotificationPriorityValue
} from "./notification-center.constants";
import {
  type NotificationChannelAdapter,
  type NotificationEventDraft,
  type NotificationRecordDraft
} from "./notification-center.types";
import {
  type NotificationChannelConfigRecord,
  type NotificationPreferenceRecord,
  type NotificationRecipientProfile,
  NotificationCenterRepository
} from "./repositories/notification-center.repository";

type DispatchNotificationEventInput = {
  event: NotificationEventDraft;
  recipientIds: string[];
  nudgeBaseAt?: Date | null;
};

type ResolvedPreference = {
  domain: NotificationPreferenceRecord["domain"];
  eventType: string;
  subscribed: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  enterpriseImEnabled: boolean;
  digestMode: NotificationPreferenceRecord["digestMode"];
  reminderFrequencyMinutes: number | null;
  nudgeThresholdMinutes: number | null;
  quietHours: Record<string, unknown> | null;
};

type RoutedChannelPlan = {
  channel: "IN_APP" | "EMAIL" | "ENTERPRISE_IM";
  adapterCode?: string;
  provider?: string;
  payload?: Record<string, unknown>;
};

const NOTIFICATION_DELIVERY_JOB_TYPE = "notification.delivery";

const DEFAULT_PREFERENCE_TEMPLATES = [
  { domain: "OA" as const, eventType: "WORKFLOW_PENDING" },
  { domain: "OA" as const, eventType: "WORKFLOW_RESULT" },
  { domain: "OA" as const, eventType: "ANNOUNCEMENT" },
  { domain: "SCRM" as const, eventType: "FOLLOW_UP_REMINDER" },
  { domain: "SCRM" as const, eventType: "RENEWAL_REMINDER" },
  { domain: "PLATFORM" as const, eventType: "GOVERNANCE_ALERT" }
] as const;

@Injectable()
export class NotificationCenterService implements OnModuleInit {
  constructor(
    private readonly notificationCenterRepository: NotificationCenterRepository,
    @Inject(NOTIFICATION_CHANNEL_ADAPTERS)
    private readonly channelAdapters: NotificationChannelAdapter[],
    private readonly jobQueueService?: JobQueueService
  ) {}

  onModuleInit(): void {
    this.jobQueueService?.registerHandler(NOTIFICATION_DELIVERY_JOB_TYPE, this.handleNotificationDeliveryJob as BackgroundJobHandler);
  }

  async listNotifications(query: ListNotificationRecordsDto, actor: AuthUser) {
    const records = await this.notificationCenterRepository.listNotificationRecords({
      recipientId: actor.id,
      domain: query.domain,
      eventType: query.eventType,
      unreadOnly: query.unreadOnly
    });

    return records.map((item) => mapNotificationRecord(item));
  }

  async markNotificationRead(notificationId: string, actor: AuthUser) {
    const record = await this.notificationCenterRepository.markNotificationRead(notificationId, actor.id);
    return mapNotificationRecord(record);
  }

  async listPreferences(actor: AuthUser) {
    const storedPreferences = await this.notificationCenterRepository.listPreferences(actor.id);
    return this.mergePreferenceTemplates(actor.id, storedPreferences).map((item) => mapNotificationPreference(item));
  }

  async updatePreferences(dto: UpsertNotificationPreferencesDto, actor: AuthUser) {
    const updated = await Promise.all(
      dto.preferences.map((item) =>
        this.notificationCenterRepository.upsertPreference({
          tenantId: actor.tenantId,
          userId: actor.id,
          domain: item.domain,
          eventType: item.eventType.trim(),
          subscribed: item.subscribed ?? true,
          // 站内消息是当前通知中心的基础渠道，这里统一强制开启，避免消息只剩外部副本。
          inAppEnabled: true,
          emailEnabled: item.emailEnabled ?? false,
          enterpriseImEnabled: item.enterpriseImEnabled ?? false,
          digestMode: item.digestMode ?? "IMMEDIATE",
          reminderFrequencyMinutes: item.reminderFrequencyMinutes ?? null,
          nudgeThresholdMinutes: item.nudgeThresholdMinutes ?? null,
          quietHours: item.quietHours ?? null
        })
      )
    );

    return updated.map((item) => mapNotificationPreference(item));
  }

  async publishEvent(input: DispatchNotificationEventInput) {
    const recipientIds = Array.from(new Set(input.recipientIds.filter(Boolean)));
    const event = await this.notificationCenterRepository.createEvent(input.event);

    if (recipientIds.length === 0) {
      await this.notificationCenterRepository.updateEventStatus(event.id, "ROUTED");

      return {
        event,
        notifications: []
      };
    }

    const [recipientProfiles, storedPreferences, channelConfigs] = await Promise.all([
      this.notificationCenterRepository.listRecipientProfiles(recipientIds),
      this.notificationCenterRepository.listPreferencesByEvent(recipientIds, event.domain, event.eventType),
      this.notificationCenterRepository.listEnabledChannelConfigs()
    ]);
    const recipientProfileMap = new Map(recipientProfiles.map((item) => [item.id, item]));
    const preferenceMap = new Map(storedPreferences.map((item) => [item.userId, item]));
    const emailChannelConfig = channelConfigs.find((item) => item.channel === "EMAIL") ?? null;
    const enterpriseImChannelConfig = channelConfigs.find((item) => item.channel === "ENTERPRISE_IM") ?? null;
    const now = new Date();
    const recordDrafts: NotificationRecordDraft[] = [];
    const routePlans: Array<{
      recipient: NotificationRecipientProfile;
      preference: ResolvedPreference;
      channels: RoutedChannelPlan[];
    }> = [];

    for (const recipientId of recipientIds) {
      const recipient = recipientProfileMap.get(recipientId);

      if (!recipient || recipient.status !== "ACTIVE") {
        continue;
      }

      const preference = this.resolvePreference(event.domain, event.eventType, preferenceMap.get(recipientId));

      if (!preference.subscribed) {
        continue;
      }

      const channels = this.resolveRoutedChannels({
        event: {
          ...event,
          requiredChannels: input.event.requiredChannels
        },
        recipient,
        preference,
        emailChannelConfig,
        enterpriseImChannelConfig,
        nudgeBaseAt: input.nudgeBaseAt
      });

      if (channels.length === 0) {
        continue;
      }

      recordDrafts.push({
        tenantId: event.tenantId ?? recipient.tenantId,
        eventId: event.id,
        recipientId,
        domain: event.domain,
        eventType: event.eventType,
        title: event.title,
        summary: event.summary ?? null,
        priority: event.priority,
        targetPath: event.targetPath ?? null,
        targetLabel: event.targetLabel ?? null,
        channelPreferences: {
          inAppEnabled: preference.inAppEnabled,
          emailEnabled: preference.emailEnabled,
          enterpriseImEnabled: preference.enterpriseImEnabled,
          digestMode: preference.digestMode
        },
        routingSnapshot: {
          channels: channels.map((item) => item.channel),
          reminderFrequencyMinutes: preference.reminderFrequencyMinutes,
          nudgeThresholdMinutes: preference.nudgeThresholdMinutes,
          nudgeBaseAt: input.nudgeBaseAt ? toIsoString(input.nudgeBaseAt) : null
        },
        deliveredAt: now
      });
      routePlans.push({
        recipient,
        preference,
        channels
      });
    }

    const createdRecords = await this.notificationCenterRepository.createNotificationRecords(recordDrafts);
    const deliveryExecutionPlans: Array<{
      record: (typeof createdRecords)[number];
      routePlan: (typeof routePlans)[number];
      payload?: Record<string, unknown>;
    }> = [];
    const deliveryDrafts = createdRecords.flatMap((record, index) =>
      routePlans[index].channels.map((channel) => {
        deliveryExecutionPlans.push({
          record,
          routePlan: routePlans[index],
          payload: channel.payload ?? undefined
        });

        return {
          notificationId: record.id,
          channel: channel.channel,
          adapterCode: channel.adapterCode ?? null,
          provider: channel.provider ?? null,
          status: channel.channel === "IN_APP" ? ("SENT" as const) : ("PENDING" as const),
          attemptCount: channel.channel === "IN_APP" ? 1 : 0,
          payload: channel.payload ?? null,
          response: channel.channel === "IN_APP" ? { mode: "IN_APP" } : null,
          lastAttemptedAt: channel.channel === "IN_APP" ? now : null,
          sentAt: channel.channel === "IN_APP" ? now : null
        };
      })
    );
    const createdDeliveries = await this.notificationCenterRepository.createNotificationDeliveries(deliveryDrafts);

    await Promise.all(
      createdDeliveries.map(async (delivery, index) => {
        if (delivery.channel === "IN_APP") {
          return delivery;
        }

        const executionPlan = deliveryExecutionPlans[index];

        if (!executionPlan) {
          return this.notificationCenterRepository.updateDeliveryResult(delivery.id, {
            status: "SKIPPED",
            errorMessage: "缺少通知路由上下文，已跳过外部发送。",
            attemptCount: 1,
            lastAttemptedAt: now
          });
        }

        if (!this.jobQueueService) {
          return this.executeNotificationDeliveryJob({
            deliveryId: delivery.id,
            notificationId: executionPlan.record.id,
            eventType: executionPlan.record.eventType,
            domain: executionPlan.record.domain,
            title: executionPlan.record.title,
            summary: executionPlan.record.summary,
            priority: executionPlan.record.priority,
            targetPath: executionPlan.record.targetPath,
            targetLabel: executionPlan.record.targetLabel,
            recipientId: executionPlan.routePlan.recipient.id,
            recipientDisplayName: executionPlan.routePlan.recipient.displayName,
            recipientEmail: executionPlan.routePlan.recipient.email,
            channel: delivery.channel,
            adapterCode: delivery.adapterCode,
            provider: delivery.provider,
            payload: executionPlan.payload ?? null,
            attempts: 1
          });
        }

        await this.jobQueueService.enqueue({
          type: NOTIFICATION_DELIVERY_JOB_TYPE,
          payload: {
            deliveryId: delivery.id,
            notificationId: executionPlan.record.id,
            eventType: executionPlan.record.eventType,
            domain: executionPlan.record.domain,
            title: executionPlan.record.title,
            summary: executionPlan.record.summary,
            priority: executionPlan.record.priority,
            targetPath: executionPlan.record.targetPath,
            targetLabel: executionPlan.record.targetLabel,
            recipientId: executionPlan.routePlan.recipient.id,
            recipientDisplayName: executionPlan.routePlan.recipient.displayName,
            recipientEmail: executionPlan.routePlan.recipient.email,
            channel: delivery.channel,
            adapterCode: delivery.adapterCode,
            provider: delivery.provider,
            payload: executionPlan.payload ?? null
          },
          correlationId: delivery.id
        });

        return delivery;
      })
    );
    this.jobQueueService?.scheduleRun([NOTIFICATION_DELIVERY_JOB_TYPE]);

    await this.notificationCenterRepository.updateEventStatus(event.id, "ROUTED");
    const notifications = await this.notificationCenterRepository.findNotificationRecordsByIds(
      createdRecords.map((item) => item.id)
    );

    return {
      event,
      notifications: notifications.map((item) => mapNotificationRecord(item))
    };
  }

  private mergePreferenceTemplates(userId: string, storedPreferences: NotificationPreferenceRecord[]) {
    const storedMap = new Map(storedPreferences.map((item) => [`${item.domain}:${item.eventType}`, item]));
    const defaults = DEFAULT_PREFERENCE_TEMPLATES.map((template) => {
      const stored = storedMap.get(`${template.domain}:${template.eventType}`);

      if (stored) {
        return stored;
      }

      return {
        id: `default:${template.domain}:${template.eventType}`,
        userId,
        domain: template.domain,
        eventType: template.eventType,
        subscribed: true,
        inAppEnabled: true,
        emailEnabled: false,
        enterpriseImEnabled: false,
        digestMode: "IMMEDIATE" as const,
        reminderFrequencyMinutes: null,
        nudgeThresholdMinutes: null,
        quietHours: null,
        createdAt: new Date(0),
        updatedAt: new Date(0)
      };
    });
    const extraStored = storedPreferences.filter(
      (item) => !DEFAULT_PREFERENCE_TEMPLATES.some((template) => template.domain === item.domain && template.eventType === item.eventType)
    );

    return [...defaults, ...extraStored];
  }

  private resolvePreference(
    domain: NotificationPreferenceRecord["domain"],
    eventType: string,
    stored?: NotificationPreferenceRecord
  ): ResolvedPreference {
    return {
      domain,
      eventType,
      subscribed: stored?.subscribed ?? true,
      inAppEnabled: true,
      emailEnabled: stored?.emailEnabled ?? false,
      enterpriseImEnabled: stored?.enterpriseImEnabled ?? false,
      digestMode: stored?.digestMode ?? "IMMEDIATE",
      reminderFrequencyMinutes: stored?.reminderFrequencyMinutes ?? null,
      nudgeThresholdMinutes: stored?.nudgeThresholdMinutes ?? null,
      quietHours: this.readRecordObject(stored?.quietHours)
    };
  }

  private resolveRoutedChannels(input: {
    event: {
      priority?: NotificationPriorityValue;
      requiredChannels?: Array<"IN_APP" | "EMAIL" | "ENTERPRISE_IM">;
      title: string;
      summary?: string | null;
      targetPath?: string | null;
      targetLabel?: string | null;
    };
    recipient: NotificationRecipientProfile;
    preference: ResolvedPreference;
    emailChannelConfig: NotificationChannelConfigRecord | null;
    enterpriseImChannelConfig: NotificationChannelConfigRecord | null;
    nudgeBaseAt?: Date | null;
  }): RoutedChannelPlan[] {
    const channels: RoutedChannelPlan[] = [
      {
        channel: "IN_APP",
        payload: {
          title: input.event.title,
          summary: input.event.summary ?? null
        }
      }
    ];
    const requiredChannels = new Set(input.event.requiredChannels ?? []);

    if (
      (input.preference.emailEnabled || requiredChannels.has("EMAIL")) &&
      input.emailChannelConfig &&
      this.shouldEscalateToExternal(input.event.priority ?? "MEDIUM", input.preference, input.nudgeBaseAt)
    ) {
      channels.push({
        channel: "EMAIL",
        adapterCode: input.emailChannelConfig.adapterCode,
        provider: input.emailChannelConfig.provider,
        payload: {
          recipientEmail: input.recipient.email ?? null,
          title: input.event.title,
          summary: input.event.summary ?? null,
          targetPath: input.event.targetPath ?? null,
          targetLabel: input.event.targetLabel ?? null
        }
      });
    }

    if (
      (input.preference.enterpriseImEnabled || requiredChannels.has("ENTERPRISE_IM")) &&
      input.enterpriseImChannelConfig &&
      this.shouldEscalateToExternal(input.event.priority ?? "MEDIUM", input.preference, input.nudgeBaseAt)
    ) {
      channels.push({
        channel: "ENTERPRISE_IM",
        adapterCode: input.enterpriseImChannelConfig.adapterCode,
        provider: input.enterpriseImChannelConfig.provider,
        payload: {
          targetUrl: input.event.targetPath ?? null,
          title: input.event.title,
          summary: input.event.summary ?? null,
          targetLabel: input.event.targetLabel ?? null
        }
      });
    }

    return channels;
  }

  private shouldEscalateToExternal(
    priority: NotificationPriorityValue,
    preference: ResolvedPreference,
    nudgeBaseAt?: Date | null
  ) {
    if (priority === "HIGH" || priority === "CRITICAL") {
      return true;
    }

    if (!nudgeBaseAt || preference.nudgeThresholdMinutes === null) {
      return false;
    }

    return Date.now() - nudgeBaseAt.getTime() >= preference.nudgeThresholdMinutes * 60 * 1000;
  }

  private findChannelAdapter(channel: string, adapterCode?: string | null) {
    return this.channelAdapters.find((item) => item.channel === channel && item.adapterCode === adapterCode) ?? null;
  }

  private handleNotificationDeliveryJob = async (job: Parameters<BackgroundJobHandler>[0]) => {
    const payload = this.readJobPayload(job.payload);
    return this.executeNotificationDeliveryJob({
      deliveryId: this.readRequiredPayloadString(payload, "deliveryId"),
      notificationId: this.readRequiredPayloadString(payload, "notificationId"),
      eventType: this.readRequiredPayloadString(payload, "eventType"),
      domain: this.readRequiredPayloadString(payload, "domain") as NotificationPreferenceRecord["domain"],
      title: this.readRequiredPayloadString(payload, "title"),
      summary: this.readOptionalPayloadString(payload, "summary") ?? null,
      priority: this.readRequiredPayloadString(payload, "priority") as NotificationPriorityValue,
      targetPath: this.readOptionalPayloadString(payload, "targetPath") ?? null,
      targetLabel: this.readOptionalPayloadString(payload, "targetLabel") ?? null,
      recipientId: this.readRequiredPayloadString(payload, "recipientId"),
      recipientDisplayName: this.readRequiredPayloadString(payload, "recipientDisplayName"),
      recipientEmail: this.readOptionalPayloadString(payload, "recipientEmail") ?? null,
      channel: this.readRequiredPayloadString(payload, "channel"),
      adapterCode: this.readOptionalPayloadString(payload, "adapterCode"),
      provider: this.readOptionalPayloadString(payload, "provider") ?? null,
      payload: this.readRecordObject(payload.payload),
      attempts: job.attempts
    });
  };

  private async executeNotificationDeliveryJob(input: {
    deliveryId: string;
    notificationId: string;
    eventType: string;
    domain: NotificationPreferenceRecord["domain"];
    title: string;
    summary: string | null;
    priority: NotificationPriorityValue;
    targetPath: string | null;
    targetLabel: string | null;
    recipientId: string;
    recipientDisplayName: string;
    recipientEmail: string | null;
    channel: string;
    adapterCode?: string | null;
    provider?: string | null;
    payload?: Record<string, unknown> | null;
    attempts: number;
  }) {
    const adapter = this.findChannelAdapter(input.channel, input.adapterCode);
    const attemptAt = new Date();

    if (!adapter) {
      await this.notificationCenterRepository.updateDeliveryResult(input.deliveryId, {
        status: "SKIPPED",
        errorMessage: `未找到 ${input.channel} 渠道适配器。`,
        attemptCount: input.attempts,
        lastAttemptedAt: attemptAt
      });

      return {
        deliveryId: input.deliveryId,
        status: "SKIPPED"
      };
    }

    const result = await adapter.send({
      notificationId: input.notificationId,
      eventType: input.eventType,
      domain: input.domain,
      title: input.title,
      summary: input.summary,
      priority: input.priority,
      targetPath: input.targetPath,
      targetLabel: input.targetLabel,
      recipientId: input.recipientId,
      recipientDisplayName: input.recipientDisplayName,
      recipientEmail: input.recipientEmail,
      adapterCode: input.adapterCode,
      provider: input.provider,
      payload: input.payload ?? null
    });

    await this.notificationCenterRepository.updateDeliveryResult(input.deliveryId, {
      status: result.status,
      externalMessageId: result.externalMessageId ?? null,
      response: result.response ?? null,
      errorMessage: result.errorMessage ?? null,
      attemptCount: input.attempts,
      lastAttemptedAt: attemptAt,
      sentAt: result.status === "SENT" ? attemptAt : null,
      failedAt: result.status === "FAILED" ? attemptAt : null
    });

    return {
      deliveryId: input.deliveryId,
      status: result.status
    };
  }

  private readJobPayload(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private readRequiredPayloadString(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];

    if (typeof value !== "string" || !value) {
      throw new BadRequestException(`Background job payload is missing ${key}.`);
    }

    return value;
  }

  private readOptionalPayloadString(payload: Record<string, unknown>, key: string): string | undefined {
    const value = payload[key];

    return typeof value === "string" && value ? value : undefined;
  }

  private readRecordObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }
}
