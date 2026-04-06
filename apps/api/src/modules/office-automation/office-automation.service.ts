/** OA service：负责 OA 业务编排、校验与审计记录。 */
import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { AuditActionType, LeaveRequestStatus } from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ApprovalActionDto } from "./dto/approval-action.dto";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { mapAnnouncementDetail, mapAnnouncementSummary, mapDirectorySnapshot, mapLeaveRequestItem, mapPendingApprovalItem, mapWorkspaceOverview } from "./mappers/office-automation.mapper";
import { OfficeAutomationRepository } from "./repositories/office-automation.repository";

const RECENT_ANNOUNCEMENT_LIMIT = 3;

@Injectable()
export class OfficeAutomationService {
  constructor(
    private readonly officeAutomationRepository: OfficeAutomationRepository,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async getWorkspaceOverview(actor: AuthUser) {
    const [pendingApprovalCount, myRequestCount, activeAnnouncementCount, directoryDepartmentCount, recentAnnouncements] =
      await Promise.all([
        this.officeAutomationRepository.countPendingApprovals(actor.id),
        this.officeAutomationRepository.countMyLeaveRequests(actor.id),
        this.officeAutomationRepository.countActiveAnnouncements(),
        this.officeAutomationRepository.countActiveDepartments(),
        this.officeAutomationRepository.listRecentAnnouncements(RECENT_ANNOUNCEMENT_LIMIT)
      ]);

    return mapWorkspaceOverview({
      pendingApprovalCount,
      myRequestCount,
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

    const approver =
      (await this.officeAutomationRepository.findDefaultApprover(actor.id)) ??
      (await this.officeAutomationRepository.findSelfApprover(actor.id));

    if (!approver) {
      throw new BadRequestException("当前没有可用审批人，暂时无法提交请假申请。");
    }

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

  async getMyLeaveRequests(actor: AuthUser) {
    const requests = await this.officeAutomationRepository.listMyLeaveRequests(actor.id);
    return requests.map((item) => mapLeaveRequestItem(item));
  }

  async getPendingApprovals(actor: AuthUser) {
    const requests = await this.officeAutomationRepository.listPendingApprovals(actor.id);
    return requests.map((item) => mapPendingApprovalItem(item));
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

  private parseDateTime(value: string, fieldName: string): Date {
    const parsed = new Date(value.replace(" ", "T"));

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName}格式无效。`);
    }

    return parsed;
  }
}
