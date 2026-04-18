/** 展示文案工具：负责把枚举、字典值和后台代号转换成中文界面文案。 */
import type { DictionaryEntry } from "@/types/dictionaries";
import type { Lead } from "@/types/leads";
import type {
  ContractStatus,
  OpportunityResultStatus,
  OpportunityStage,
  PaymentPlanStatus,
  QuoteStatus,
  RenewalReminderStatus
} from "@/types/opportunities";
import type {
  BatchTaskCategory,
  BatchTaskStatus,
  GovernanceHealthStatus,
  IdentityConnectorMatchField,
  IdentityConnectorType,
  OpenApiCredentialStatus,
  StorageProvider,
  SchedulerJobStatus
} from "@/types/system-administration";
import type { WebhookDeliveryStatus, WebhookSubscriptionStatus } from "@/types/system-administration";

const ACCESS_STATUS_LABELS: Record<"ACTIVE" | "DISABLED", string> = {
  ACTIVE: "启用",
  DISABLED: "停用"
};

const LEAD_STATUS_LABELS: Record<Lead["status"], string> = {
  NEW: "新建",
  CONTACTED: "已联系",
  QUALIFIED: "已确认",
  CONVERTED: "已转客户",
  CLOSED: "已关闭"
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  SIGN_IN: "登录",
  SIGN_IN_FAILED: "登录失败",
  ACCESS: "访问",
  ACCESS_DENIED: "访问拒绝",
  CREATE: "新增",
  UPDATE: "更新",
  DELETE: "删除",
  ENABLE: "启用",
  DISABLE: "停用",
  ASSIGN: "分配",
  CONVERT: "转化",
  UPLOAD: "上传",
  WEBHOOK_DELIVERY: "回调投递",
  WEBHOOK_DELIVERY_FAILED: "回调投递失败",
  SESSION_REVOKE: "会话撤销"
};

const AUDIT_TARGET_TYPE_LABELS: Record<string, string> = {
  auth: "身份认证",
  "auth-session": "登录会话",
  customer: "客户",
  "customer-tag": "客户标签",
  "customer-tags": "客户标签关联",
  "customer-followup": "客户跟进",
  lead: "线索",
  "lead-followup": "线索跟进",
  "sales-opportunity": "商机",
  "sales-opportunity-stage": "商机阶段",
  attachment: "附件",
  "open-api-credential": "开放接口凭证",
  "webhook-subscription": "回调订阅",
  "webhook-delivery": "回调投递",
  "identity-connector": "身份连接器"
};

const DICTIONARY_TYPE_LABELS: Record<string, string> = {
  "customer-source": "客户来源",
  "customer-status": "客户状态"
};

const GOVERNANCE_HEALTH_STATUS_LABELS: Record<GovernanceHealthStatus, string> = {
  HEALTHY: "正常",
  WARNING: "关注",
  ERROR: "异常"
};

const BATCH_TASK_CATEGORY_LABELS: Record<BatchTaskCategory, string> = {
  IMPORT: "导入",
  EXPORT: "导出"
};

const BATCH_TASK_STATUS_LABELS: Record<BatchTaskStatus, string> = {
  PENDING: "排队中",
  RUNNING: "处理中",
  SUCCEEDED: "已完成",
  FAILED: "失败"
};

const SCHEDULER_JOB_STATUS_LABELS: Record<SchedulerJobStatus, string> = {
  RUNNING: "运行中",
  PAUSED: "已暂停"
};

const OPEN_API_CREDENTIAL_STATUS_LABELS: Record<OpenApiCredentialStatus, string> = {
  ACTIVE: "启用中",
  REVOKED: "已撤销"
};

const WEBHOOK_SUBSCRIPTION_STATUS_LABELS: Record<WebhookSubscriptionStatus, string> = {
  ACTIVE: "启用中",
  DISABLED: "已停用"
};

const WEBHOOK_DELIVERY_STATUS_LABELS: Record<WebhookDeliveryStatus, string> = {
  PENDING: "待投递",
  SUCCEEDED: "已成功",
  FAILED: "失败"
};

const IDENTITY_CONNECTOR_TYPE_LABELS: Record<IdentityConnectorType, string> = {
  SSO: "统一单点登录（SSO）",
  LDAP: "目录服务（LDAP）",
  OAUTH: "授权登录（OAuth）"
};

const IDENTITY_CONNECTOR_MATCH_FIELD_LABELS: Record<IdentityConnectorMatchField, string> = {
  EMAIL: "邮箱（Email）映射",
  USERNAME: "用户名（Username）映射"
};

const STORAGE_PROVIDER_LABELS: Record<StorageProvider, string> = {
  LOCAL: "本地存储",
  OSS: "阿里云对象存储（OSS）",
  S3: "对象存储（S3）"
};

const OPEN_API_SCOPE_LABELS: Record<string, string> = {
  "customer:read": "客户只读"
};

const WEBHOOK_EVENT_TYPE_LABELS: Record<string, string> = {
  APPROVAL_COMPLETED: "审批完成",
  REVENUE_PAYMENT_RECEIVED: "回款到账",
  WORKFLOW_INSTANCE_COMPLETED: "流程实例完成",
  GOVERNANCE_ALERT: "治理告警"
};

const NOTIFICATION_CHANNEL_LABELS: Record<string, string> = {
  IN_APP: "站内消息",
  EMAIL: "邮件",
  ENTERPRISE_IM: "企业即时通讯（IM）",
  "站内消息": "站内消息",
  "企业 IM": "企业即时通讯（IM）"
};

const NOTIFICATION_PROVIDER_LABELS: Record<string, string> = {
  smtp: "邮件网关（SMTP）",
  SMTP: "邮件网关（SMTP）",
  im: "即时通讯（IM）",
  "enterprise-im": "企业即时通讯（IM）",
  feishu: "飞书",
  dingtalk: "钉钉",
  "wechat-work": "企业微信"
};

const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  DISCOVERY: "需求发现",
  QUALIFICATION: "机会确认",
  PROPOSAL: "方案提报",
  NEGOTIATION: "商务谈判",
  CLOSED_WON: "赢单",
  CLOSED_LOST: "输单"
};

const OPPORTUNITY_RESULT_LABELS: Record<OpportunityResultStatus, string> = {
  IN_PROGRESS: "进行中",
  WON: "赢单",
  LOST: "输单"
};

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "草稿",
  SENT: "已发送",
  ACCEPTED: "已接受",
  REJECTED: "已拒绝",
  EXPIRED: "已过期"
};

const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: "草稿",
  ACTIVE: "履约中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  EXPIRED: "已到期"
};

const PAYMENT_PLAN_STATUS_LABELS: Record<PaymentPlanStatus, string> = {
  PENDING: "待回款",
  PARTIAL: "部分回款",
  PAID: "已回款",
  OVERDUE: "已逾期",
  CANCELLED: "已取消"
};

const RENEWAL_REMINDER_STATUS_LABELS: Record<RenewalReminderStatus, string> = {
  PENDING: "待跟进",
  CONTACTED: "已联系",
  COMPLETED: "已完成",
  DISMISSED: "已忽略"
};

function padDateTimePart(value: number): string {
  return String(value).padStart(2, "0");
}

function buildDateTimeString(value: Date): string {
  return [
    `${value.getFullYear()}-${padDateTimePart(value.getMonth() + 1)}-${padDateTimePart(value.getDate())}`,
    `${padDateTimePart(value.getHours())}:${padDateTimePart(value.getMinutes())}:${padDateTimePart(value.getSeconds())}`
  ].join(" ");
}

function normalizeLocalDateTimeString(value: string): string | null {
  const trimmedValue = value.trim();
  const dateOnlyMatch = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})$/);

  if (dateOnlyMatch) {
    return `${dateOnlyMatch[1]} 00:00:00`;
  }

  const localDateTimeMatch = trimmedValue.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?(?:\.\d{1,3})?$/
  );

  if (localDateTimeMatch) {
    return `${localDateTimeMatch[1]} ${localDateTimeMatch[2]}:${localDateTimeMatch[3] ?? "00"}`;
  }

  return null;
}

export function formatAccessStatus(value?: "ACTIVE" | "DISABLED" | string | null): string {
  if (!value) {
    return "-";
  }

  return ACCESS_STATUS_LABELS[value as "ACTIVE" | "DISABLED"] ?? value;
}

export function formatLeadStatus(value?: Lead["status"] | string | null): string {
  if (!value) {
    return "-";
  }

  return LEAD_STATUS_LABELS[value as Lead["status"]] ?? value;
}

export function formatAuditActionType(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return AUDIT_ACTION_LABELS[value] ?? value;
}

export function formatAuditTargetType(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return AUDIT_TARGET_TYPE_LABELS[value] ?? value;
}

export function formatDictionaryValue(value: string | null | undefined, options: DictionaryEntry[]): string {
  if (!value) {
    return "-";
  }

  const matchedOption = options.find((item) => item.value === value || item.label === value);

  return matchedOption?.label ?? value;
}

export function formatDictionaryType(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return DICTIONARY_TYPE_LABELS[value] ?? value;
}

export function formatGovernanceHealthStatus(value?: GovernanceHealthStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return GOVERNANCE_HEALTH_STATUS_LABELS[value as GovernanceHealthStatus] ?? value;
}

export function formatBatchTaskCategory(value?: BatchTaskCategory | string | null): string {
  if (!value) {
    return "-";
  }

  return BATCH_TASK_CATEGORY_LABELS[value as BatchTaskCategory] ?? value;
}

export function formatBatchTaskStatus(value?: BatchTaskStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return BATCH_TASK_STATUS_LABELS[value as BatchTaskStatus] ?? value;
}

export function formatSchedulerJobStatus(value?: SchedulerJobStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return SCHEDULER_JOB_STATUS_LABELS[value as SchedulerJobStatus] ?? value;
}

export function formatOpenApiCredentialStatus(value?: OpenApiCredentialStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return OPEN_API_CREDENTIAL_STATUS_LABELS[value as OpenApiCredentialStatus] ?? value;
}

export function formatWebhookSubscriptionStatus(value?: WebhookSubscriptionStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return WEBHOOK_SUBSCRIPTION_STATUS_LABELS[value as WebhookSubscriptionStatus] ?? value;
}

export function formatWebhookDeliveryStatus(value?: WebhookDeliveryStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return WEBHOOK_DELIVERY_STATUS_LABELS[value as WebhookDeliveryStatus] ?? value;
}

export function formatIdentityConnectorType(value?: IdentityConnectorType | string | null): string {
  if (!value) {
    return "-";
  }

  return IDENTITY_CONNECTOR_TYPE_LABELS[value as IdentityConnectorType] ?? value;
}

export function formatIdentityConnectorMatchField(value?: IdentityConnectorMatchField | string | null): string {
  if (!value) {
    return "-";
  }

  return IDENTITY_CONNECTOR_MATCH_FIELD_LABELS[value as IdentityConnectorMatchField] ?? value;
}

export function formatStorageProvider(value?: StorageProvider | string | null): string {
  if (!value) {
    return "-";
  }

  return STORAGE_PROVIDER_LABELS[value as StorageProvider] ?? value;
}

export function formatOpenApiScope(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return OPEN_API_SCOPE_LABELS[value] ?? value;
}

export function formatWebhookEventType(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return WEBHOOK_EVENT_TYPE_LABELS[value] ?? value;
}

export function formatNotificationChannel(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return NOTIFICATION_CHANNEL_LABELS[value] ?? value;
}

export function formatNotificationProvider(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return NOTIFICATION_PROVIDER_LABELS[value] ?? value;
}

export function formatNotificationRouteScope(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return value
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" / ");
}

export function formatCronExpression(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return `Cron 表达式（Cron）：${value}`;
}

export function formatOpportunityStage(value?: OpportunityStage | string | null): string {
  if (!value) {
    return "-";
  }

  return OPPORTUNITY_STAGE_LABELS[value as OpportunityStage] ?? value;
}

export function formatOpportunityResult(value?: OpportunityResultStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return OPPORTUNITY_RESULT_LABELS[value as OpportunityResultStatus] ?? value;
}

export function formatQuoteStatus(value?: QuoteStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return QUOTE_STATUS_LABELS[value as QuoteStatus] ?? value;
}

export function formatContractStatus(value?: ContractStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return CONTRACT_STATUS_LABELS[value as ContractStatus] ?? value;
}

export function formatPaymentPlanStatus(value?: PaymentPlanStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return PAYMENT_PLAN_STATUS_LABELS[value as PaymentPlanStatus] ?? value;
}

export function formatRenewalReminderStatus(value?: RenewalReminderStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return RENEWAL_REMINDER_STATUS_LABELS[value as RenewalReminderStatus] ?? value;
}

export function formatAmount(value?: number | null): string {
  if (value === undefined || value === null) {
    return "-";
  }

  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  // 已经是本地时间字符串时直接归一化，避免再次解析后发生不必要的时区偏移。
  const normalizedValue = normalizeLocalDateTimeString(value);

  if (normalizedValue) {
    return normalizedValue;
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return value;
  }

  return buildDateTimeString(parsedValue);
}
