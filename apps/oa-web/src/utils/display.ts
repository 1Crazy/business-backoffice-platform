/** 展示文案工具：负责把后端枚举和英文代号转换成更适合界面展示的中文文案。 */
import type { LeaveRequestStatus } from "@/types/office-automation";

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
