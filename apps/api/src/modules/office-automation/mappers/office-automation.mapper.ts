/** OA mapper：负责把 OA 领域持久化结果转换为前端可直接消费的接口结构。 */
import { toIsoString } from "@/common/mappers/date-time.mapper";
import type {
  AnnouncementRecord,
  DirectoryDepartmentRecord,
  DirectoryMemberRecord,
  LeaveRequestRecord
} from "../repositories/office-automation.repository";

export function mapAnnouncementSummary(record: AnnouncementRecord) {
  return {
    id: record.id,
    title: record.title,
    summary: record.summary ?? null,
    publishedAt: toIsoString(record.publishedAt)!,
    publishedByName: record.publishedBy.displayName
  };
}

export function mapAnnouncementDetail(record: AnnouncementRecord) {
  return {
    ...mapAnnouncementSummary(record),
    content: record.content
  };
}

export function mapWorkspaceOverview(input: {
  pendingApprovalCount: number;
  myRequestCount: number;
  activeAnnouncementCount: number;
  directoryDepartmentCount: number;
  recentAnnouncements: AnnouncementRecord[];
}) {
  return {
    pendingApprovalCount: input.pendingApprovalCount,
    myRequestCount: input.myRequestCount,
    activeAnnouncementCount: input.activeAnnouncementCount,
    directoryDepartmentCount: input.directoryDepartmentCount,
    recentAnnouncements: input.recentAnnouncements.map((item) => mapAnnouncementSummary(item))
  };
}

export function mapPendingApprovalItem(record: LeaveRequestRecord) {
  return {
    id: record.id,
    applicantName: record.applicant.displayName,
    leaveType: record.leaveType,
    startAt: toIsoString(record.startAt)!,
    endAt: toIsoString(record.endAt)!,
    reason: record.reason,
    status: record.status,
    createdAt: toIsoString(record.createdAt)!
  };
}

export function mapLeaveRequestItem(record: LeaveRequestRecord) {
  return {
    id: record.id,
    leaveType: record.leaveType,
    startAt: toIsoString(record.startAt)!,
    endAt: toIsoString(record.endAt)!,
    reason: record.reason,
    status: record.status,
    applicantName: record.applicant.displayName,
    currentApproverName: record.approver.displayName,
    latestComment: record.actions[0]?.comment ?? null,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapDirectorySnapshot(input: {
  departments: DirectoryDepartmentRecord[];
  members: DirectoryMemberRecord[];
}) {
  return {
    departments: input.departments.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code
    })),
    members: input.members.map((item) => ({
      id: item.id,
      username: item.username,
      displayName: item.displayName,
      email: item.email ?? null,
      phone: item.phone ?? null,
      departmentName: item.department?.name ?? null
    }))
  };
}
