/** OA 领域类型：负责维护工作台、审批、公告和通讯录的请求/响应契约。 */
export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type AdministrativeRequestType = "REIMBURSEMENT" | "TRAVEL" | "PURCHASE" | "SEAL";
export type AdministrativeRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type AdministrativeRequestActionType = "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ApprovalDecision = "APPROVED" | "REJECTED";
export type PendingApprovalCategory = "LEAVE" | "ADMINISTRATIVE";

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
  administrativeRequestPendingCount: number;
  administrativeRequestMyCount: number;
  activeAnnouncementCount: number;
  directoryDepartmentCount: number;
  recentAnnouncements: AnnouncementSummary[];
}

export interface PendingApprovalItem {
  id: string;
  requestCategory: PendingApprovalCategory;
  requestType: string;
  requestNo?: string | null;
  applicantName: string;
  title: string;
  summary: string;
  submittedAt: string;
  status: LeaveRequestStatus | AdministrativeRequestStatus;
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

export interface AdministrativeRequestItem {
  id: string;
  requestNo: string;
  type: AdministrativeRequestType;
  title: string;
  summary: string;
  reason: string;
  status: AdministrativeRequestStatus;
  attachmentNames: string[];
  applicantName?: string | null;
  approverName?: string | null;
  latestComment?: string | null;
  submittedAt: string;
  decidedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdministrativeRequestField {
  label: string;
  value: string;
}

export interface AdministrativeRequestTimelineItem {
  actionType: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  actorName: string;
  comment?: string | null;
  createdAt: string;
}

export interface AdministrativeRequestDetail extends AdministrativeRequestItem {
  formFields: AdministrativeRequestField[];
  timeline: AdministrativeRequestTimelineItem[];
}

export interface LeaveRequestPayload {
  leaveType: string;
  startAt: string;
  endAt: string;
  reason: string;
}

export interface AdministrativeRequestPayload {
  type: AdministrativeRequestType;
  title: string;
  reason: string;
  attachmentNames?: string[];
  expenseDate?: string;
  expenseCategory?: string;
  amount?: number;
  payeeName?: string;
  startAt?: string;
  endAt?: string;
  destination?: string;
  transportation?: string;
  estimatedAmount?: number;
  itemName?: string;
  quantity?: number;
  budgetAmount?: number;
  neededBy?: string;
  documentName?: string;
  sealType?: string;
  useDate?: string;
  copyCount?: number;
}

export interface ListAdministrativeRequestQuery {
  type?: AdministrativeRequestType | "";
  status?: AdministrativeRequestStatus | "";
  startDate?: string;
  endDate?: string;
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
