/** 通知中心 repository：负责统一消息事件、通知记录、用户偏好和渠道配置的持久化。 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";
import type {
  NotificationDeliveryDraft,
  NotificationEventDraft,
  NotificationPreferenceDraft,
  NotificationRecordDraft
} from "../notification-center.types";

const toJsonObject = (value: Record<string, unknown>): Prisma.InputJsonValue => value as Prisma.InputJsonObject;

const toOptionalJsonObject = (
  value: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonObject;
};

const notificationEventSelect = Prisma.validator<Prisma.NotificationEventSelect>()({
  id: true,
  tenantId: true,
  eventType: true,
  domain: true,
  sourceType: true,
  sourceId: true,
  title: true,
  summary: true,
  priority: true,
  status: true,
  payload: true,
  metadata: true,
  targetPath: true,
  targetLabel: true,
  actorId: true,
  occurredAt: true,
  createdAt: true,
  updatedAt: true
});

const notificationDeliverySelect = Prisma.validator<Prisma.NotificationDeliverySelect>()({
  id: true,
  notificationId: true,
  channel: true,
  adapterCode: true,
  provider: true,
  status: true,
  externalMessageId: true,
  attemptCount: true,
  payload: true,
  response: true,
  errorMessage: true,
  lastAttemptedAt: true,
  sentAt: true,
  failedAt: true,
  createdAt: true,
  updatedAt: true
});

const notificationRecordSelect = Prisma.validator<Prisma.NotificationRecordSelect>()({
  id: true,
  eventId: true,
  recipientId: true,
  domain: true,
  eventType: true,
  title: true,
  summary: true,
  priority: true,
  status: true,
  targetPath: true,
  targetLabel: true,
  channelPreferences: true,
  routingSnapshot: true,
  deliveredAt: true,
  readAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  deliveries: {
    select: notificationDeliverySelect,
    orderBy: {
      createdAt: "asc"
    }
  }
});

const notificationPreferenceSelect = Prisma.validator<Prisma.NotificationPreferenceSelect>()({
  id: true,
  userId: true,
  domain: true,
  eventType: true,
  subscribed: true,
  inAppEnabled: true,
  emailEnabled: true,
  enterpriseImEnabled: true,
  digestMode: true,
  reminderFrequencyMinutes: true,
  nudgeThresholdMinutes: true,
  quietHours: true,
  createdAt: true,
  updatedAt: true
});

const notificationChannelConfigSelect = Prisma.validator<Prisma.NotificationChannelConfigSelect>()({
  id: true,
  channel: true,
  adapterCode: true,
  provider: true,
  displayName: true,
  description: true,
  isEnabled: true,
  config: true,
  capabilities: true,
  createdAt: true,
  updatedAt: true
});

const notificationRecipientSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  tenantId: true,
  displayName: true,
  email: true,
  status: true
});

export type NotificationEventRecord = Prisma.NotificationEventGetPayload<{ select: typeof notificationEventSelect }>;
export type NotificationRecordEntity = Prisma.NotificationRecordGetPayload<{ select: typeof notificationRecordSelect }>;
export type NotificationDeliveryRecord = Prisma.NotificationDeliveryGetPayload<{ select: typeof notificationDeliverySelect }>;
export type NotificationPreferenceRecord = Prisma.NotificationPreferenceGetPayload<{ select: typeof notificationPreferenceSelect }>;
export type NotificationChannelConfigRecord = Prisma.NotificationChannelConfigGetPayload<{ select: typeof notificationChannelConfigSelect }>;
export type NotificationRecipientProfile = Prisma.UserGetPayload<{ select: typeof notificationRecipientSelect }>;

@Injectable()
export class NotificationCenterRepository {
  constructor(private readonly prisma: PrismaService) {}

  createEvent(input: NotificationEventDraft): Promise<NotificationEventRecord> {
    return this.prisma.notificationEvent.create({
      data: {
        tenantId: input.tenantId ?? undefined,
        eventType: input.eventType,
        domain: input.domain,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        title: input.title,
        summary: input.summary ?? undefined,
        priority: input.priority ?? "MEDIUM",
        payload: toJsonObject(input.payload),
        metadata: toOptionalJsonObject(input.metadata),
        targetPath: input.targetPath ?? undefined,
        targetLabel: input.targetLabel ?? undefined,
        actorId: input.actorId ?? undefined,
        occurredAt: input.occurredAt
      },
      select: notificationEventSelect
    });
  }

  createNotificationRecords(input: NotificationRecordDraft[]): Promise<NotificationRecordEntity[]> {
    if (input.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.$transaction(
      input.map((item) =>
        this.prisma.notificationRecord.create({
          data: {
            tenantId: item.tenantId ?? undefined,
            eventId: item.eventId,
            recipientId: item.recipientId,
            domain: item.domain,
            eventType: item.eventType,
            title: item.title,
            summary: item.summary ?? undefined,
            priority: item.priority ?? "MEDIUM",
            targetPath: item.targetPath ?? undefined,
            targetLabel: item.targetLabel ?? undefined,
            channelPreferences: toOptionalJsonObject(item.channelPreferences),
            routingSnapshot: toOptionalJsonObject(item.routingSnapshot),
            deliveredAt: item.deliveredAt ?? undefined
          },
          select: notificationRecordSelect
        })
      )
    );
  }

  createNotificationDeliveries(input: NotificationDeliveryDraft[]): Promise<NotificationDeliveryRecord[]> {
    if (input.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.$transaction(
      input.map((item) =>
        this.prisma.notificationDelivery.create({
          data: {
            notificationId: item.notificationId,
            channel: item.channel,
            adapterCode: item.adapterCode ?? undefined,
            provider: item.provider ?? undefined,
            status: item.status ?? undefined,
            externalMessageId: item.externalMessageId ?? undefined,
            attemptCount: item.attemptCount ?? undefined,
            payload: toOptionalJsonObject(item.payload),
            response: toOptionalJsonObject(item.response),
            errorMessage: item.errorMessage ?? undefined,
            lastAttemptedAt: item.lastAttemptedAt ?? undefined,
            sentAt: item.sentAt ?? undefined,
            failedAt: item.failedAt ?? undefined
          },
          select: notificationDeliverySelect
        })
      )
    );
  }

  upsertPreference(input: NotificationPreferenceDraft): Promise<NotificationPreferenceRecord> {
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_domain_eventType: {
          userId: input.userId,
          domain: input.domain,
          eventType: input.eventType
        }
      },
      update: {
        tenantId: input.tenantId ?? undefined,
        subscribed: input.subscribed,
        inAppEnabled: input.inAppEnabled,
        emailEnabled: input.emailEnabled,
        enterpriseImEnabled: input.enterpriseImEnabled,
        digestMode: input.digestMode,
        reminderFrequencyMinutes: input.reminderFrequencyMinutes,
        nudgeThresholdMinutes: input.nudgeThresholdMinutes,
        quietHours: toOptionalJsonObject(input.quietHours)
      },
      create: {
        tenantId: input.tenantId ?? undefined,
        userId: input.userId,
        domain: input.domain,
        eventType: input.eventType,
        subscribed: input.subscribed ?? true,
        inAppEnabled: input.inAppEnabled ?? true,
        emailEnabled: input.emailEnabled ?? false,
        enterpriseImEnabled: input.enterpriseImEnabled ?? false,
        digestMode: input.digestMode ?? "IMMEDIATE",
        reminderFrequencyMinutes: input.reminderFrequencyMinutes,
        nudgeThresholdMinutes: input.nudgeThresholdMinutes,
        quietHours: toOptionalJsonObject(input.quietHours)
      },
      select: notificationPreferenceSelect
    });
  }

  listPreferences(userId: string): Promise<NotificationPreferenceRecord[]> {
    return this.prisma.notificationPreference.findMany({
      where: {
        userId
      },
      select: notificationPreferenceSelect,
      orderBy: [
        {
          domain: "asc"
        },
        {
          eventType: "asc"
        }
      ]
    });
  }

  listPreferencesByEvent(userIds: string[], domain: NotificationPreferenceRecord["domain"], eventType: string) {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.notificationPreference.findMany({
      where: {
        userId: {
          in: userIds
        },
        domain,
        eventType
      },
      select: notificationPreferenceSelect
    });
  }

  listNotificationRecords(input: {
    recipientId: string;
    domain?: NotificationRecordEntity["domain"];
    eventType?: string;
    unreadOnly?: boolean;
  }): Promise<NotificationRecordEntity[]> {
    return this.prisma.notificationRecord.findMany({
      where: {
        recipientId: input.recipientId,
        domain: input.domain,
        eventType: input.eventType,
        ...(input.unreadOnly ? { status: "UNREAD" } : {})
      },
      select: notificationRecordSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });
  }

  findNotificationRecordsByIds(notificationIds: string[]): Promise<NotificationRecordEntity[]> {
    if (notificationIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.notificationRecord.findMany({
      where: {
        id: {
          in: notificationIds
        }
      },
      select: notificationRecordSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });
  }

  async markNotificationRead(notificationId: string, recipientId: string): Promise<NotificationRecordEntity> {
    await this.prisma.notificationRecord.findFirstOrThrow({
      where: {
        id: notificationId,
        recipientId
      },
      select: {
        id: true
      }
    });

    return this.prisma.notificationRecord.update({
      where: {
        id: notificationId
      },
      data: {
        status: "READ",
        readAt: new Date()
      },
      select: notificationRecordSelect
    });
  }

  updateEventStatus(eventId: string, status: NotificationEventRecord["status"]) {
    return this.prisma.notificationEvent.update({
      where: {
        id: eventId
      },
      data: {
        status
      },
      select: notificationEventSelect
    });
  }

  updateDeliveryResult(
    deliveryId: string,
    input: {
      status: NotificationDeliveryRecord["status"];
      externalMessageId?: string | null;
      response?: Record<string, unknown> | null;
      errorMessage?: string | null;
      attemptCount?: number;
      lastAttemptedAt?: Date | null;
      sentAt?: Date | null;
      failedAt?: Date | null;
    }
  ) {
    return this.prisma.notificationDelivery.update({
      where: {
        id: deliveryId
      },
      data: {
        status: input.status,
        externalMessageId: input.externalMessageId ?? undefined,
        response: toOptionalJsonObject(input.response),
        errorMessage: input.errorMessage ?? undefined,
        attemptCount: input.attemptCount ?? undefined,
        lastAttemptedAt: input.lastAttemptedAt ?? undefined,
        sentAt: input.sentAt ?? undefined,
        failedAt: input.failedAt ?? undefined
      },
      select: notificationDeliverySelect
    });
  }

  listEnabledChannelConfigs(): Promise<NotificationChannelConfigRecord[]> {
    return this.prisma.notificationChannelConfig.findMany({
      where: {
        isEnabled: true
      },
      select: notificationChannelConfigSelect,
      orderBy: [
        {
          channel: "asc"
        },
        {
          displayName: "asc"
        }
      ]
    });
  }

  listRecipientProfiles(userIds: string[]): Promise<NotificationRecipientProfile[]> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: notificationRecipientSelect
    });
  }
}
