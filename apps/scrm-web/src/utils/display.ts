/** 展示文案工具：负责把枚举、字典值和后台代号转换成中文界面文案。 */
import type { DictionaryEntry } from "@/types/dictionaries";
import type { Lead } from "@/types/leads";
import type { OpportunityResultStatus, OpportunityStage } from "@/types/opportunities";

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
  CREATE: "新增",
  UPDATE: "更新",
  DELETE: "删除",
  ENABLE: "启用",
  DISABLE: "停用",
  ASSIGN: "分配",
  CONVERT: "转化",
  UPLOAD: "上传",
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
  attachment: "附件"
};

const DICTIONARY_TYPE_LABELS: Record<string, string> = {
  "customer-source": "客户来源",
  "customer-status": "客户状态"
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

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
