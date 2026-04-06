/** OA 审批 API：负责封装待审批、我的申请和审批动作相关请求。 */
import { http } from "@/api/http";
import type {
  ApprovalActionPayload,
  LeaveRequestItem,
  LeaveRequestPayload,
  PendingApprovalItem
} from "@/types/office-automation";

export async function fetchPendingApprovals(): Promise<PendingApprovalItem[]> {
  const { data } = await http.get<PendingApprovalItem[]>("/oa/approvals/pending");
  return data;
}

export async function fetchMyLeaveRequests(): Promise<LeaveRequestItem[]> {
  const { data } = await http.get<LeaveRequestItem[]>("/oa/leaves/mine");
  return data;
}

export async function createLeaveRequest(payload: LeaveRequestPayload): Promise<void> {
  await http.post("/oa/leaves", payload);
}

export async function decideLeaveRequest(requestId: string, payload: ApprovalActionPayload): Promise<void> {
  await http.post(`/oa/approvals/leave-requests/${requestId}/actions`, payload);
}
