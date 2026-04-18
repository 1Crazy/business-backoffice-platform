/** 通知中心类型：负责声明统一事件、订阅偏好与渠道适配器接口，不承载运行时副作用。 */
import type {
  NotificationChannelValue,
  NotificationDeliveryStatusValue,
  NotificationDigestModeValue,
  NotificationDomainValue,
  NotificationPriorityValue
} from "./notification-center.constants";

export interface NotificationEventDraft {
  tenantId?: string | null;
  eventType: string;
  domain: NotificationDomainValue;
  sourceType: string;
  sourceId: string;
  title: string;
  summary?: string | null;
  priority?: NotificationPriorityValue;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
  targetPath?: string | null;
  targetLabel?: string | null;
  actorId?: string | null;
  occurredAt: Date;
}

export interface NotificationRecordDraft {
  tenantId?: string | null;
  eventId: string;
  recipientId: string;
  domain: NotificationDomainValue;
  eventType: string;
  title: string;
  summary?: string | null;
  priority?: NotificationPriorityValue;
  targetPath?: string | null;
  targetLabel?: string | null;
  channelPreferences?: Record<string, unknown> | null;
  routingSnapshot?: Record<string, unknown> | null;
  deliveredAt?: Date | null;
}

export interface NotificationDeliveryDraft {
  notificationId: string;
  channel: NotificationChannelValue;
  adapterCode?: string | null;
  provider?: string | null;
  status?: NotificationDeliveryStatusValue;
  externalMessageId?: string | null;
  attemptCount?: number;
  payload?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
  errorMessage?: string | null;
  lastAttemptedAt?: Date | null;
  sentAt?: Date | null;
  failedAt?: Date | null;
}

export interface NotificationPreferenceDraft {
  tenantId?: string | null;
  userId: string;
  domain: NotificationDomainValue;
  eventType: string;
  subscribed?: boolean;
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  enterpriseImEnabled?: boolean;
  digestMode?: NotificationDigestModeValue;
  reminderFrequencyMinutes?: number | null;
  nudgeThresholdMinutes?: number | null;
  quietHours?: Record<string, unknown> | null;
}

export interface NotificationChannelAdapterPayload {
  notificationId: string;
  eventType: string;
  domain: NotificationDomainValue;
  title: string;
  summary?: string | null;
  priority: NotificationPriorityValue;
  targetPath?: string | null;
  targetLabel?: string | null;
  recipientId: string;
  recipientDisplayName?: string | null;
  recipientEmail?: string | null;
  adapterCode?: string | null;
  provider?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface NotificationChannelAdapterResult {
  status: NotificationDeliveryStatusValue;
  externalMessageId?: string | null;
  response?: Record<string, unknown> | null;
  errorMessage?: string | null;
}

export interface NotificationChannelAdapter {
  readonly channel: NotificationChannelValue;
  readonly adapterCode: string;
  send(input: NotificationChannelAdapterPayload): Promise<NotificationChannelAdapterResult>;
}
