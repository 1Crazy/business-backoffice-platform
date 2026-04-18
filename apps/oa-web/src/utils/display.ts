/** 展示文案工具：负责把后端枚举和英文代号转换成更适合界面展示的中文文案。 */
import type {
  AdministrativeRequestActionType,
  AdministrativeRequestStatus,
  AdministrativeRequestType,
  LeaveRequestStatus,
  PendingApprovalCategory,
  WorkflowTemplateKey
} from "@/types/office-automation";

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: "年假",
  SICK: "病假",
  PERSONAL: "事假",
  OTHER: "其他"
};

const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  PENDING: "待审批",
  APPROVED: "已通过",
  REJECTED: "已驳回",
  CANCELLED: "已撤销"
};

const ADMINISTRATIVE_REQUEST_TYPE_LABELS: Record<AdministrativeRequestType, string> = {
  REIMBURSEMENT: "报销申请",
  TRAVEL: "出差申请",
  PURCHASE: "采购申请",
  SEAL: "用印申请"
};

const ADMINISTRATIVE_REQUEST_STATUS_LABELS: Record<AdministrativeRequestStatus, string> = {
  PENDING: "待审批",
  APPROVED: "已通过",
  REJECTED: "已驳回",
  CANCELLED: "已撤销"
};

const ADMINISTRATIVE_REQUEST_ACTION_LABELS: Record<AdministrativeRequestActionType, string> = {
  SUBMITTED: "已提交",
  APPROVED: "审批通过",
  REJECTED: "审批驳回",
  CANCELLED: "已撤回"
};

const APPROVAL_CATEGORY_LABELS: Record<PendingApprovalCategory, string> = {
  LEAVE: "请假流程",
  ADMINISTRATIVE: "行政流程"
};

const WORKFLOW_TEMPLATE_LABELS: Record<WorkflowTemplateKey, string> = {
  LEAVE: "请假申请",
  REIMBURSEMENT: "报销申请",
  TRAVEL: "出差申请",
  PURCHASE: "采购申请",
  SEAL: "用印申请"
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

export function formatLeaveType(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return LEAVE_TYPE_LABELS[value] ?? value;
}

export function formatLeaveStatus(value?: LeaveRequestStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return LEAVE_STATUS_LABELS[value as LeaveRequestStatus] ?? value;
}

export function formatAdministrativeRequestType(value?: AdministrativeRequestType | string | null): string {
  if (!value) {
    return "-";
  }

  return ADMINISTRATIVE_REQUEST_TYPE_LABELS[value as AdministrativeRequestType] ?? value;
}

export function formatAdministrativeRequestStatus(value?: AdministrativeRequestStatus | string | null): string {
  if (!value) {
    return "-";
  }

  return ADMINISTRATIVE_REQUEST_STATUS_LABELS[value as AdministrativeRequestStatus] ?? value;
}

export function formatAdministrativeRequestActionType(
  value?: AdministrativeRequestActionType | string | null
): string {
  if (!value) {
    return "-";
  }

  return ADMINISTRATIVE_REQUEST_ACTION_LABELS[value as AdministrativeRequestActionType] ?? value;
}

export function formatApprovalCategory(value?: PendingApprovalCategory | string | null): string {
  if (!value) {
    return "-";
  }

  return APPROVAL_CATEGORY_LABELS[value as PendingApprovalCategory] ?? value;
}

export function formatWorkflowTemplate(value?: WorkflowTemplateKey | string | null): string {
  if (!value) {
    return "-";
  }

  return WORKFLOW_TEMPLATE_LABELS[value as WorkflowTemplateKey] ?? value;
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
