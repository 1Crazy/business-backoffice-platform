/** OA service：负责 OA 业务编排、校验与审计记录。 */
import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { AdministrativeRequestStatus, AuditActionType, LeaveRequestStatus } from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ApprovalActionDto } from "./dto/approval-action.dto";
import { CreateAdministrativeRequestDto } from "./dto/create-administrative-request.dto";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { ListAdministrativeRequestsDto } from "./dto/list-administrative-requests.dto";
import {
  mapAdministrativeRequestDetail,
  mapAdministrativeRequestItem,
  mapAnnouncementDetail,
  mapAnnouncementSummary,
  mapDirectorySnapshot,
  mapLeaveRequestItem,
  mapPendingAdministrativeApprovalItem,
  mapPendingApprovalItem,
  mapWorkspaceOverview
} from "./mappers/office-automation.mapper";
import { AdministrativeRequestRecord, OfficeAutomationRepository } from "./repositories/office-automation.repository";
import {
  buildAdministrativeRequestDraft,
  generateAdministrativeRequestNo
} from "./utils/administrative-request.utils";

const RECENT_ANNOUNCEMENT_LIMIT = 3;

@Injectable()
export class OfficeAutomationService {
  constructor(
    private readonly officeAutomationRepository: OfficeAutomationRepository,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async getWorkspaceOverview(actor: AuthUser) {
    const [
      pendingLeaveApprovalCount,
      pendingAdministrativeApprovalCount,
      myLeaveRequestCount,
      myAdministrativeRequestCount,
      activeAnnouncementCount,
      directoryDepartmentCount,
      recentAnnouncements
    ] = await Promise.all([
      this.officeAutomationRepository.countPendingApprovals(actor.id),
      this.officeAutomationRepository.countPendingAdministrativeApprovals(actor.id),
      this.officeAutomationRepository.countMyLeaveRequests(actor.id),
      this.officeAutomationRepository.countMyAdministrativeRequests(actor.id),
      this.officeAutomationRepository.countActiveAnnouncements(),
      this.officeAutomationRepository.countActiveDepartments(),
      this.officeAutomationRepository.listRecentAnnouncements(RECENT_ANNOUNCEMENT_LIMIT)
    ]);

    return mapWorkspaceOverview({
      pendingApprovalCount: pendingLeaveApprovalCount + pendingAdministrativeApprovalCount,
      myRequestCount: myLeaveRequestCount + myAdministrativeRequestCount,
      administrativeRequestPendingCount: pendingAdministrativeApprovalCount,
      administrativeRequestMyCount: myAdministrativeRequestCount,
      activeAnnouncementCount,
      directoryDepartmentCount,
      recentAnnouncements
    });
  }

  async createLeaveRequest(dto: CreateLeaveRequestDto, actor: AuthUser) {
    const startAt = this.parseDateTime(dto.startAt, "开始时间");
    const endAt = this.parseDateTime(dto.endAt, "结束时间");

    if (startAt.getTime() >= endAt.getTime()) {
      throw new BadRequestException("结束时间必须晚于开始时间。");
    }

    const approver = await this.resolveApprover(actor.id);
    const request = await this.officeAutomationRepository.createLeaveRequest({
      applicantId: actor.id,
      approverId: approver.id,
      leaveType: dto.leaveType.trim(),
      startAt,
      endAt,
      reason: dto.reason.trim()
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "oa-leave-request",
      targetId: request.id,
      detail: {
        approverId: approver.id,
        leaveType: request.leaveType,
        startAt: request.startAt.toISOString(),
        endAt: request.endAt.toISOString()
      }
    });

    return mapLeaveRequestItem(request);
  }

  async createAdministrativeRequest(dto: CreateAdministrativeRequestDto, actor: AuthUser) {
    const approver = await this.resolveApprover(actor.id, "oa:request:approve");
    const draft = buildAdministrativeRequestDraft(dto);
    const request = await this.officeAutomationRepository.createAdministrativeRequest({
      requestNo: generateAdministrativeRequestNo(dto.type),
      type: dto.type,
      title: draft.title,
      summary: draft.summary,
      reason: dto.reason.trim(),
      formData: draft.formData,
      attachmentNames: draft.attachmentNames,
      applicantId: actor.id,
      approverId: approver.id
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "oa-administrative-request",
      targetId: request.id,
      detail: {
        requestNo: request.requestNo,
        type: request.type,
        approverId: approver.id
      }
    });

    return mapAdministrativeRequestItem(request);
  }

  async getMyLeaveRequests(actor: AuthUser) {
    const requests = await this.officeAutomationRepository.listMyLeaveRequests(actor.id);
    return requests.map((item) => mapLeaveRequestItem(item));
  }

  async getMyAdministrativeRequests(actor: AuthUser, query: ListAdministrativeRequestsDto) {
    const requests = await this.officeAutomationRepository.listMyAdministrativeRequests(actor.id);
    return requests
      .filter((item) => this.matchesAdministrativeRequestFilters(item, query))
      .map((item) => mapAdministrativeRequestItem(item));
  }

  async listAdministrativeRequests(query: ListAdministrativeRequestsDto) {
    const requests = await this.officeAutomationRepository.listAdministrativeRequests({
      type: query.type,
      status: query.status,
      applicantId: query.applicantId,
      approverId: query.approverId,
      submittedAt:
        query.startDate || query.endDate
          ? {
              gte: query.startDate ? new Date(`${query.startDate}T00:00:00`) : undefined,
              lte: query.endDate ? new Date(`${query.endDate}T23:59:59`) : undefined
            }
          : undefined
    });

    return requests.map((item) => mapAdministrativeRequestItem(item));
  }

  async getAdministrativeRequestDetail(id: string, actor: AuthUser) {
    const request = await this.officeAutomationRepository.findAdministrativeRequestById(id);

    this.assertAdministrativeRequestAccessible(request, actor);
    return mapAdministrativeRequestDetail(request);
  }

  async getPendingApprovals(actor: AuthUser) {
    const [leaveRequests, administrativeRequests] = await Promise.all([
      this.officeAutomationRepository.listPendingApprovals(actor.id),
      this.officeAutomationRepository.listPendingAdministrativeApprovals(actor.id)
    ]);

    return [
      ...leaveRequests.map((item) => mapPendingApprovalItem(item)),
      ...administrativeRequests.map((item) => mapPendingAdministrativeApprovalItem(item))
    ].sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
  }

  async getPendingAdministrativeApprovals(actor: AuthUser, query: ListAdministrativeRequestsDto) {
    const requests = await this.officeAutomationRepository.listPendingAdministrativeApprovals(actor.id);

    return requests
      .filter((item) => this.matchesAdministrativeRequestFilters(item, query))
      .map((item) => mapAdministrativeRequestItem(item));
  }

  async decideLeaveRequest(requestId: string, dto: ApprovalActionDto, actor: AuthUser) {
    const request = await this.officeAutomationRepository.findLeaveRequestById(requestId);
    const isSuperAdmin = actor.roleCodes.includes("super-admin");

    if (!isSuperAdmin && request.approver.id !== actor.id) {
      throw new ForbiddenException("当前账号不能处理这条审批记录。");
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException("当前审批记录已处理，不能重复审批。");
    }

    const nextStatus =
      dto.decision === "APPROVED" ? LeaveRequestStatus.APPROVED : LeaveRequestStatus.REJECTED;
    const normalizedComment = dto.comment?.trim() || undefined;
    const decidedRequest = await this.officeAutomationRepository.applyApprovalDecision({
      requestId,
      actorId: actor.id,
      status: nextStatus,
      comment: normalizedComment
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "oa-leave-request",
      targetId: decidedRequest.id,
      detail: {
        decision: dto.decision,
        comment: normalizedComment ?? null
      }
    });

    return mapLeaveRequestItem(decidedRequest);
  }

  async decideAdministrativeRequest(requestId: string, dto: ApprovalActionDto, actor: AuthUser) {
    const request = await this.officeAutomationRepository.findAdministrativeRequestById(requestId);
    const isSuperAdmin = actor.roleCodes.includes("super-admin");

    if (!isSuperAdmin && request.approver.id !== actor.id) {
      throw new ForbiddenException("当前账号不能处理这条审批记录。");
    }

    if (request.status !== AdministrativeRequestStatus.PENDING) {
      throw new BadRequestException("当前审批记录已处理，不能重复审批。");
    }

    const nextStatus =
      dto.decision === "APPROVED"
        ? AdministrativeRequestStatus.APPROVED
        : AdministrativeRequestStatus.REJECTED;
    const normalizedComment = dto.comment?.trim() || undefined;
    const decidedRequest = await this.officeAutomationRepository.applyAdministrativeApprovalDecision({
      requestId,
      actorId: actor.id,
      status: nextStatus,
      comment: normalizedComment
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "oa-administrative-request",
      targetId: decidedRequest.id,
      detail: {
        requestNo: decidedRequest.requestNo,
        decision: dto.decision,
        comment: normalizedComment ?? null
      }
    });

    return mapAdministrativeRequestItem(decidedRequest);
  }

  async cancelAdministrativeRequest(requestId: string, actor: AuthUser) {
    const request = await this.officeAutomationRepository.findAdministrativeRequestById(requestId);
    const isSuperAdmin = actor.roleCodes.includes("super-admin");

    if (!isSuperAdmin && request.applicant.id !== actor.id) {
      throw new ForbiddenException("当前账号不能撤回这条行政申请。");
    }

    if (request.status !== AdministrativeRequestStatus.PENDING) {
      throw new BadRequestException("只有待审批的行政申请可以撤回。");
    }

    const cancelledRequest = await this.officeAutomationRepository.applyAdministrativeCancellation({
      requestId,
      actorId: actor.id
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "oa-administrative-request",
      targetId: cancelledRequest.id,
      detail: {
        requestNo: cancelledRequest.requestNo,
        decision: "CANCELLED"
      }
    });

    return mapAdministrativeRequestItem(cancelledRequest);
  }

  async getAnnouncements() {
    const announcements = await this.officeAutomationRepository.listAnnouncements();
    return announcements.map((item) => mapAnnouncementSummary(item));
  }

  async getAnnouncementDetail(id: string) {
    const announcement = await this.officeAutomationRepository.findAnnouncementById(id);
    return mapAnnouncementDetail(announcement);
  }

  async getDirectorySnapshot(departmentId?: string) {
    const [departments, members] = await Promise.all([
      this.officeAutomationRepository.listActiveDepartments(),
      this.officeAutomationRepository.listDirectoryMembers(departmentId)
    ]);

    return mapDirectorySnapshot({
      departments,
      members
    });
  }

  private async resolveApprover(applicantId: string, permissionCode = "oa:approval:write") {
    const approver =
      (await this.officeAutomationRepository.findDefaultApprover(applicantId, permissionCode)) ??
      (await this.officeAutomationRepository.findSelfApprover(applicantId, permissionCode));

    if (!approver) {
      throw new BadRequestException("当前没有可用审批人，暂时无法提交申请。");
    }

    return approver;
  }

  private assertAdministrativeRequestAccessible(request: AdministrativeRequestRecord, actor: AuthUser): void {
    const isSuperAdmin = actor.roleCodes.includes("super-admin");
    const canReadAll = actor.permissions.includes("oa:request:read");
    const isParticipant = request.applicant.id === actor.id || request.approver.id === actor.id;

    if (!isSuperAdmin && !canReadAll && !isParticipant) {
      throw new ForbiddenException("当前账号不能查看这条行政申请。");
    }
  }

  private matchesAdministrativeRequestFilters(
    item: AdministrativeRequestRecord,
    query: ListAdministrativeRequestsDto
  ): boolean {
    if (query.type && item.type !== query.type) {
      return false;
    }

    if (query.status && item.status !== query.status) {
      return false;
    }

    if (query.startDate) {
      const startDate = new Date(`${query.startDate}T00:00:00`);

      if (item.submittedAt.getTime() < startDate.getTime()) {
        return false;
      }
    }

    if (query.endDate) {
      const endDate = new Date(`${query.endDate}T23:59:59`);

      if (item.submittedAt.getTime() > endDate.getTime()) {
        return false;
      }
    }

    return true;
  }

  private parseDateTime(value: string, fieldName: string): Date {
    const parsed = new Date(value.replace(" ", "T"));

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName}格式无效。`);
    }

    return parsed;
  }

}
