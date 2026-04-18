/** 通知中心 mapper：负责把持久化结果转换成接口结构和路由快照。 */
import { toIsoString } from "@/common/mappers/date-time.mapper";
import type {
  NotificationPreferenceRecord,
  NotificationRecordEntity
} from "../repositories/notification-center.repository";

export function mapNotificationRecord(record: NotificationRecordEntity) {
  return {
    id: record.id,
    eventId: record.eventId,
    domain: record.domain,
    eventType: record.eventType,
    title: record.title,
    summary: record.summary ?? null,
    priority: record.priority,
    status: record.status,
    targetPath: record.targetPath ?? null,
    targetLabel: record.targetLabel ?? null,
    channelPreferences: readRecordObject(record.channelPreferences),
    routingSnapshot: readRecordObject(record.routingSnapshot),
    deliveredAt: toIsoString(record.deliveredAt) ?? null,
    readAt: toIsoString(record.readAt) ?? null,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!,
    deliveries: record.deliveries.map((delivery) => ({
      id: delivery.id,
      channel: delivery.channel,
      adapterCode: delivery.adapterCode ?? null,
      provider: delivery.provider ?? null,
      status: delivery.status,
      externalMessageId: delivery.externalMessageId ?? null,
      attemptCount: delivery.attemptCount,
      errorMessage: delivery.errorMessage ?? null,
      lastAttemptedAt: toIsoString(delivery.lastAttemptedAt) ?? null,
      sentAt: toIsoString(delivery.sentAt) ?? null,
      failedAt: toIsoString(delivery.failedAt) ?? null
    }))
  };
}

export function mapNotificationPreference(record: NotificationPreferenceRecord) {
  return {
    id: record.id,
    domain: record.domain,
    eventType: record.eventType,
    subscribed: record.subscribed,
    inAppEnabled: record.inAppEnabled,
    emailEnabled: record.emailEnabled,
    enterpriseImEnabled: record.enterpriseImEnabled,
    digestMode: record.digestMode,
    reminderFrequencyMinutes: record.reminderFrequencyMinutes ?? null,
    nudgeThresholdMinutes: record.nudgeThresholdMinutes ?? null,
    quietHours: readRecordObject(record.quietHours),
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

function readRecordObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
