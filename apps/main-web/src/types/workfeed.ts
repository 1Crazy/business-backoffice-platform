/** Workfeed types mirror the backend unified todo/notification contracts. */
export const WORKFEED_DOMAINS = ["oa", "scrm"] as const;
export type WorkfeedDomain = (typeof WORKFEED_DOMAINS)[number];
export const WORKFEED_DOMAIN_LABELS: Record<WorkfeedDomain, string> = {
  oa: "办公协同",
  scrm: "客户经营"
};

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

export interface WorkfeedTodo {
  id: string;
  domain: WorkfeedDomain;
  type: WorkfeedTodoType;
  title: string;
  summary?: string | null;
  priority: WorkfeedPriority;
  dueAt?: string | null;
  status: string;
  targetPath: string;
  targetLabel: string;
  sourceId: string;
  createdAt: string;
}

export interface WorkfeedNotification {
  id: string;
  domain: WorkfeedDomain;
  type: WorkfeedNotificationType;
  title: string;
  summary?: string | null;
  priority: WorkfeedPriority;
  targetPath: string;
  targetLabel: string;
  sourceId: string;
  occurredAt: string;
  isRead: boolean;
  readAt?: string | null;
}

export interface ListWorkfeedTodosParams {
  domain?: WorkfeedDomain;
  type?: WorkfeedTodoType;
  priority?: WorkfeedPriority;
}

export interface ListWorkfeedNotificationsParams {
  domain?: WorkfeedDomain;
  type?: WorkfeedNotificationType;
  unreadOnly?: boolean;
}
