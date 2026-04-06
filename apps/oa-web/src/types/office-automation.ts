/** OA 领域类型：负责维护工作台、审批、公告和通讯录的请求/响应契约。 */
export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ApprovalDecision = "APPROVED" | "REJECTED";

export interface AnnouncementSummary {
  id: string;
  title: string;
  summary?: string | null;
  publishedAt: string;
  publishedByName: string;
}

export interface AnnouncementDetail extends AnnouncementSummary {
  content: string;
}

export interface WorkspaceOverview {
  pendingApprovalCount: number;
  myRequestCount: number;
  activeAnnouncementCount: number;
  directoryDepartmentCount: number;
  recentAnnouncements: AnnouncementSummary[];
}

export interface PendingApprovalItem {
  id: string;
  applicantName: string;
  leaveType: string;
  startAt: string;
  endAt: string;
  reason: string;
  status: LeaveRequestStatus;
  createdAt: string;
}

export interface LeaveRequestItem {
  id: string;
  leaveType: string;
  startAt: string;
  endAt: string;
  reason: string;
  status: LeaveRequestStatus;
  applicantName?: string;
  currentApproverName?: string | null;
  latestComment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestPayload {
  leaveType: string;
  startAt: string;
  endAt: string;
  reason: string;
}

export interface ApprovalActionPayload {
  decision: ApprovalDecision;
  comment?: string;
}

export interface DirectoryDepartment {
  id: string;
  name: string;
  code: string;
}

export interface DirectoryMember {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  departmentName?: string | null;
}

export interface DirectorySnapshot {
  departments: DirectoryDepartment[];
  members: DirectoryMember[];
}
