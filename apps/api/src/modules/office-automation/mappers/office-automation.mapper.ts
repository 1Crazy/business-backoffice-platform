/** OA mapper：负责把 OA 领域持久化结果转换为前端可直接消费的接口结构。 */
import { AdministrativeRequestType } from "@prisma/client";

import { toIsoString } from "@/common/mappers/date-time.mapper";
import type {
  AdministrativeRequestRecord,
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
  administrativeRequestPendingCount: number;
  administrativeRequestMyCount: number;
  activeAnnouncementCount: number;
  directoryDepartmentCount: number;
  recentAnnouncements: AnnouncementRecord[];
}) {
  return {
    pendingApprovalCount: input.pendingApprovalCount,
    myRequestCount: input.myRequestCount,
    administrativeRequestPendingCount: input.administrativeRequestPendingCount,
    administrativeRequestMyCount: input.administrativeRequestMyCount,
    activeAnnouncementCount: input.activeAnnouncementCount,
    directoryDepartmentCount: input.directoryDepartmentCount,
    recentAnnouncements: input.recentAnnouncements.map((item) => mapAnnouncementSummary(item))
  };
}

export function mapPendingApprovalItem(record: LeaveRequestRecord) {
  return {
    id: record.id,
    requestCategory: "LEAVE",
    requestType: record.leaveType,
    requestNo: null,
    applicantName: record.applicant.displayName,
    title: `${record.leaveType} 请假申请`,
    summary: `${toIsoString(record.startAt)!} 至 ${toIsoString(record.endAt)!}`,
    submittedAt: toIsoString(record.createdAt)!,
    status: record.status
  };
}

export function mapPendingAdministrativeApprovalItem(record: AdministrativeRequestRecord) {
  return {
    id: record.id,
    requestCategory: "ADMINISTRATIVE",
    requestType: record.type,
    requestNo: record.requestNo,
    applicantName: record.applicant.displayName,
    title: record.title,
    summary: record.summary,
    submittedAt: toIsoString(record.submittedAt)!,
    status: record.status
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

export function mapAdministrativeRequestItem(record: AdministrativeRequestRecord) {
  return {
    id: record.id,
    requestNo: record.requestNo,
    type: record.type,
    title: record.title,
    summary: record.summary,
    reason: record.reason,
    status: record.status,
    attachmentNames: readAttachmentNames(record.attachmentNames),
    applicantName: record.applicant.displayName,
    approverName: record.approver.displayName,
    latestComment: record.actions.find((item) => item.comment)?.comment ?? null,
    submittedAt: toIsoString(record.submittedAt)!,
    decidedAt: toIsoString(record.decidedAt) ?? null,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapAdministrativeRequestDetail(record: AdministrativeRequestRecord) {
  return {
    ...mapAdministrativeRequestItem(record),
    formFields: buildAdministrativeRequestFields(record),
    timeline: record.actions
      .slice()
      .reverse()
      .map((item) => ({
        actionType: item.actionType,
        actorName: item.actor.displayName,
        comment: item.comment ?? null,
        createdAt: toIsoString(item.createdAt)!
      }))
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

function readAttachmentNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => (typeof item === "string" ? item : "")).filter(Boolean);
}

function buildAdministrativeRequestFields(record: AdministrativeRequestRecord) {
  const data = readRecordObject(record.formData);

  switch (record.type) {
    case AdministrativeRequestType.REIMBURSEMENT:
      return [
        { label: "报销日期", value: readRecordString(data.expenseDate) },
        { label: "报销类别", value: readRecordString(data.expenseCategory) },
        { label: "报销对象", value: readRecordString(data.payeeName) },
        { label: "报销金额", value: formatUnknownValue(data.amount) }
      ];
    case AdministrativeRequestType.TRAVEL:
      return [
        { label: "开始时间", value: readRecordString(data.startAt) },
        { label: "结束时间", value: readRecordString(data.endAt) },
        { label: "目的地", value: readRecordString(data.destination) },
        { label: "交通方式", value: readRecordString(data.transportation) },
        { label: "预估费用", value: formatUnknownValue(data.estimatedAmount) }
      ];
    case AdministrativeRequestType.PURCHASE:
      return [
        { label: "采购物品", value: readRecordString(data.itemName) },
        { label: "采购数量", value: formatUnknownValue(data.quantity) },
        { label: "预算金额", value: formatUnknownValue(data.budgetAmount) },
        { label: "期望到位时间", value: readRecordString(data.neededBy) }
      ];
    case AdministrativeRequestType.SEAL:
      return [
        { label: "文件名称", value: readRecordString(data.documentName) },
        { label: "用印类型", value: readRecordString(data.sealType) },
        { label: "用印时间", value: readRecordString(data.useDate) },
        { label: "用印份数", value: formatUnknownValue(data.copyCount) }
      ];
    default:
      return [];
  }
}

function readRecordObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readRecordString(value: unknown): string {
  return typeof value === "string" && value ? value : "-";
}

function formatUnknownValue(value: unknown): string {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string" && value) {
    return value;
  }

  return "-";
}
