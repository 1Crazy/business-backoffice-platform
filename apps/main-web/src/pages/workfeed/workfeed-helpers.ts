import {
  NOTIFICATION_TYPES,
  TODO_TYPES,
  WORKFEED_DOMAINS,
  WORKFEED_DOMAIN_LABELS,
  WORKFEED_PRIORITIES,
  type WorkfeedNotification,
  type WorkfeedNotificationType,
  type WorkfeedPriority,
  type WorkfeedTodo,
  type WorkfeedTodoType
} from "@/types/workfeed";

export type WorkfeedTab = "todos" | "notifications";
export type DrawerEntry = WorkfeedTodo | WorkfeedNotification;
export type DrawerEntryKind = "todo" | "notification";
export type WorkfeedSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

const PRIORITY_LABELS: Record<WorkfeedPriority, string> = {
  HIGH: "高优先",
  MEDIUM: "中优先",
  LOW: "低优先"
};

const TODO_TYPE_LABELS: Record<WorkfeedTodoType, string> = {
  LEAVE_APPROVAL: "请假审批",
  ADMINISTRATIVE_APPROVAL: "行政审批",
  CUSTOMER_REMINDER: "客户提醒",
  LEAD_REMINDER: "线索提醒",
  RENEWAL_REMINDER: "续费提醒"
};

const NOTIFICATION_TYPE_LABELS: Record<WorkfeedNotificationType, string> = {
  LEAVE_RESULT: "请假结果",
  ADMINISTRATIVE_RESULT: "行政结果",
  CUSTOMER_REMINDER: "客户提醒",
  LEAD_REMINDER: "线索提醒",
  RENEWAL_REMINDER: "续费提醒",
  ANNOUNCEMENT: "公告摘要"
};

const TODO_STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  IN_PROGRESS: "处理中",
  COMPLETED: "已完成"
};

export function getPriorityLabel(priority: WorkfeedPriority): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

export function getTodoTypeLabel(type: WorkfeedTodoType): string {
  return TODO_TYPE_LABELS[type] ?? type;
}

export function getNotificationTypeLabel(type: WorkfeedNotificationType): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? type;
}

export function getTodoStatusLabel(status: string): string {
  return TODO_STATUS_LABELS[status] ?? status;
}

export function getDomainLabel(domain: string): string {
  return WORKFEED_DOMAIN_LABELS[domain as keyof typeof WORKFEED_DOMAIN_LABELS] ?? domain;
}

export function getNotificationSubscriptionCaption(type: WorkfeedNotificationType): string {
  if (type === "ANNOUNCEMENT") {
    return "公告";
  }

  return type.includes("REMINDER") ? "提醒" : "结果";
}

export function buildDomainOptions() {
  return WORKFEED_DOMAINS.map((domain) => ({
    value: domain,
    label: WORKFEED_DOMAIN_LABELS[domain]
  }));
}

export function buildTodoTypeOptions() {
  return TODO_TYPES.map((type) => ({
    value: type,
    label: getTodoTypeLabel(type)
  }));
}

export function buildNotificationTypeOptions() {
  return NOTIFICATION_TYPES.map((type) => ({
    value: type,
    label: getNotificationTypeLabel(type)
  }));
}

export function buildPriorityOptions() {
  return WORKFEED_PRIORITIES.map((priority) => ({
    value: priority,
    label: getPriorityLabel(priority)
  }));
}
