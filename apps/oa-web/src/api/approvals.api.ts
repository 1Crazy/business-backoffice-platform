/** OA 审批 API：负责封装待审批、我的申请和审批动作相关请求。 */
import { http } from "@/api/http";
import type {
  AdministrativeRequestDetail,
  AdministrativeRequestItem,
  AdministrativeRequestPayload,
  ApprovalActionPayload,
  LeaveRequestItem,
  ListAdministrativeRequestQuery,
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

export async function fetchMyAdministrativeRequests(
  query?: ListAdministrativeRequestQuery
): Promise<AdministrativeRequestItem[]> {
  const { data } = await http.get<AdministrativeRequestItem[]>("/oa/administrative-requests/mine", {
    params: query
  });
  return data;
}

export async function fetchPendingAdministrativeApprovals(
  query?: ListAdministrativeRequestQuery
): Promise<AdministrativeRequestItem[]> {
  const { data } = await http.get<AdministrativeRequestItem[]>("/oa/administrative-requests/pending", {
    params: query
  });
  return data;
}

export async function fetchAdministrativeRequestDetail(requestId: string): Promise<AdministrativeRequestDetail> {
  const { data } = await http.get<AdministrativeRequestDetail>(`/oa/administrative-requests/${requestId}`);
  return data;
}

export async function createAdministrativeRequest(payload: AdministrativeRequestPayload): Promise<void> {
  await http.post("/oa/administrative-requests", payload);
}

export async function decideAdministrativeRequest(requestId: string, payload: ApprovalActionPayload): Promise<void> {
  await http.post(`/oa/administrative-requests/${requestId}/actions`, payload);
}

export async function cancelAdministrativeRequest(requestId: string): Promise<void> {
  await http.post(`/oa/administrative-requests/${requestId}/cancel`);
}
