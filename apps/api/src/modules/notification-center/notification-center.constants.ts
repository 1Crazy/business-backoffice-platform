/** 通知中心常量：负责统一声明通知域、渠道和优先级枚举，供模块内复用。 */
export const NOTIFICATION_CHANNEL_ADAPTERS = Symbol("NOTIFICATION_CHANNEL_ADAPTERS");

export const NOTIFICATION_DOMAINS = ["OA", "SCRM", "PLATFORM", "SYSTEM"] as const;
export type NotificationDomainValue = (typeof NOTIFICATION_DOMAINS)[number];

export const NOTIFICATION_CHANNELS = ["IN_APP", "EMAIL", "ENTERPRISE_IM"] as const;
export type NotificationChannelValue = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type NotificationPriorityValue = (typeof NOTIFICATION_PRIORITIES)[number];

export const NOTIFICATION_DIGEST_MODES = ["IMMEDIATE", "HOURLY", "DAILY", "WEEKLY"] as const;
export type NotificationDigestModeValue = (typeof NOTIFICATION_DIGEST_MODES)[number];

export const NOTIFICATION_DELIVERY_STATUSES = ["PENDING", "SENT", "FAILED", "SKIPPED"] as const;
export type NotificationDeliveryStatusValue = (typeof NOTIFICATION_DELIVERY_STATUSES)[number];
