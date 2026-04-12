export const WORKFEED_DOMAINS = ["oa", "scrm"] as const;
export type WorkfeedDomain = (typeof WORKFEED_DOMAINS)[number];

export const TODO_TYPES = [
  "LEAVE_APPROVAL",
  "ADMINISTRATIVE_APPROVAL",
  "CUSTOMER_REMINDER",
  "LEAD_REMINDER",
  "RENEWAL_REMINDER"
] as const;
export type WorkfeedTodoType = (typeof TODO_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "LEAVE_RESULT",
  "ADMINISTRATIVE_RESULT",
  "CUSTOMER_REMINDER",
  "LEAD_REMINDER",
  "RENEWAL_REMINDER",
  "ANNOUNCEMENT"
] as const;
export type WorkfeedNotificationType = (typeof NOTIFICATION_TYPES)[number];

export const WORKFEED_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type WorkfeedPriority = (typeof WORKFEED_PRIORITIES)[number];
