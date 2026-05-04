/** leads 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { ForbiddenException, Injectable } from "@nestjs/common";
import { AuditActionType, FollowUpEntityType, LeadStatus, Prisma, ReminderStatus } from "@prisma/client";

import { AccessPolicyService } from "@/common/access-policy/access-policy.service";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { DataScopeService } from "@/common/data-scope/data-scope.service";
import { requireTenantId } from "@/common/tenant/tenant.util";
import {
  getPaginationParams,
  resolveSort
} from "@/common/pagination/pagination.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { NotificationCenterService } from "../notification-center/notification-center.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { CreateLeadFollowUpDto } from "./dto/create-lead-follow-up.dto";
import { ListLeadRemindersDto, REMINDER_SORT_FIELDS, type ReminderSortField } from "./dto/list-lead-reminders.dto";
import { LEAD_SORT_FIELDS, type LeadSortField, ListLeadsDto } from "./dto/list-leads.dto";
import { ReassignLeadOwnerDto } from "./dto/reassign-lead-owner.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import {
  mapLead,
  mapLeadFollowUp,
  mapLeadReminder,
  mapPaginatedLeadReminders,
  mapPaginatedLeads
} from "./mappers/leads.mapper";
import { LeadsRepository } from "./repositories/leads.repository";

const LEAD_DEFAULT_SORT: { field: LeadSortField; order: Prisma.SortOrder } = {
  field: "createdAt",
  order: "desc"
};

const REMINDER_DEFAULT_SORT: { field: ReminderSortField; order: Prisma.SortOrder } = {
  field: "remindAt",
  order: "asc"
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly leadsRepository: LeadsRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataScopeService: DataScopeService,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly notificationCenterService: NotificationCenterService
  ) {}

  async list(query: ListLeadsDto, actor: AuthUser) {
    // 线索列表和提醒列表都必须先收敛到当前角色可见的 owner 范围，再叠加搜索和排序条件。
    const ownerFilter = await this.dataScopeService.buildScopedOwnerFilter(actor, query.ownerId);
    const pagination = getPaginationParams(query);
    const sort = resolveSort(query, LEAD_SORT_FIELDS, LEAD_DEFAULT_SORT);
    const where: Prisma.LeadWhereInput = {
      ...ownerFilter,
      source: query.source,
      status: query.status,
      OR: query.keyword
        ? [
            { name: { contains: query.keyword, mode: "insensitive" } },
            { contactName: { contains: query.keyword, mode: "insensitive" } },
            { phone: { contains: query.keyword, mode: "insensitive" } }
          ]
        : undefined
    };
    const orderBy: Prisma.LeadOrderByWithRelationInput[] = [
      { [sort.field]: sort.order } as Prisma.LeadOrderByWithRelationInput,
      { id: "desc" }
    ];
    const { items, total } = await this.leadsRepository.list(requireTenantId(actor), where, orderBy, pagination);
    const response = mapPaginatedLeads(items, total, pagination, sort);

    response.items = response.items.map((item) => this.accessPolicyService.sanitizeReadFields(actor, "lead", item));
    return response;
  }

  async detail(id: string, actor: AuthUser) {
    const lead = await this.leadsRepository.findDetailById(id, requireTenantId(actor));

    await this.assertLeadAccessible(lead.ownerId, actor);
    return this.accessPolicyService.sanitizeReadFields(actor, "lead", mapLead(lead));
  }

  async create(dto: CreateLeadDto, actor: AuthUser) {
    this.accessPolicyService.assertWritableFields(actor, "lead", dto as unknown as Record<string, unknown>);

    if (dto.ownerId) {
      await this.dataScopeService.assertOwnerAccessible(
        actor,
        dto.ownerId,
        "You cannot assign leads outside your data scope."
      );
    }

    const lead = await this.leadsRepository.createLead({
      tenantId: requireTenantId(actor),
      name: dto.name,
      contactName: dto.contactName,
      phone: dto.phone,
      source: dto.source,
      notes: dto.notes,
      // 新建线索默认落到当前操作人名下，避免后续提醒和数据范围出现“无负责人”例外。
      ownerId: dto.ownerId ?? actor.id
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "lead",
      targetId: lead.id
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "lead", mapLead(lead));
  }

  async update(id: string, dto: UpdateLeadDto, actor: AuthUser) {
    const lead = await this.leadsRepository.findOwnerById(id, requireTenantId(actor));

    await this.assertLeadAccessible(lead.ownerId, actor);
    this.accessPolicyService.assertWritableFields(actor, "lead", dto as unknown as Record<string, unknown>);

    if (dto.ownerId) {
      await this.dataScopeService.assertOwnerAccessible(
        actor,
        dto.ownerId,
        "You cannot assign leads outside your data scope."
      );
    }

    const updated = await this.leadsRepository.updateLead(id, requireTenantId(actor), {
      name: dto.name,
      contactName: dto.contactName,
      phone: dto.phone,
      source: dto.source,
      notes: dto.notes,
      ownerId: dto.ownerId,
      status: dto.status
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "lead",
      targetId: updated.id
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "lead", mapLead(updated));
  }

  async reassignOwner(id: string, dto: ReassignLeadOwnerDto, actor: AuthUser) {
    const lead = await this.leadsRepository.findOwnerById(id, requireTenantId(actor));

    await this.assertLeadAccessible(lead.ownerId, actor);
    await this.dataScopeService.assertOwnerAccessible(
      actor,
      dto.ownerId,
      "You cannot assign leads outside your data scope."
    );

    const updated = await this.leadsRepository.updateOwner(id, requireTenantId(actor), dto.ownerId);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.ASSIGN,
      targetType: "lead",
      targetId: id,
      detail: {
        fromOwnerId: lead.ownerId,
        toOwnerId: dto.ownerId
      }
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "lead", mapLead(updated));
  }

  async convert(id: string, actor: AuthUser) {
    const lead = await this.leadsRepository.findSnapshotById(id, requireTenantId(actor));

    await this.assertLeadAccessible(lead.ownerId, actor);

    // 状态字段和 convertedCustomerId 任一命中都视为已转化，避免历史脏数据导致重复转客户。
    if (lead.status === LeadStatus.CONVERTED || lead.convertedCustomerId) {
      throw new ForbiddenException("该线索已经完成转化。");
    }

    const customer = await this.leadsRepository.convertLeadToCustomer(lead);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CONVERT,
      targetType: "lead",
      targetId: id,
      detail: {
        customerId: customer.id
      }
    });

    return this.detail(id, actor);
  }

  async listFollowUps(id: string, actor: AuthUser) {
    const lead = await this.leadsRepository.findOwnerById(id, requireTenantId(actor));

    await this.assertLeadAccessible(lead.ownerId, actor);

    const followUps = await this.leadsRepository.listFollowUps(id, requireTenantId(actor));

    return followUps.map((followUp) => mapLeadFollowUp(followUp));
  }

  async createFollowUp(id: string, dto: CreateLeadFollowUpDto, actor: AuthUser) {
    const lead = await this.leadsRepository.findOwnerById(id, requireTenantId(actor));

    await this.assertLeadAccessible(lead.ownerId, actor);

    const followUp = await this.leadsRepository.createFollowUp({
      tenantId: requireTenantId(actor),
      leadId: id,
      ownerId: lead.ownerId,
      createdById: actor.id,
      content: dto.content,
      nextFollowUpAt: dto.nextFollowUpAt,
      entityType: FollowUpEntityType.LEAD
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "lead-followup",
      targetId: followUp.id
    });

    if (dto.nextFollowUpAt) {
      const remindAt = new Date(dto.nextFollowUpAt);

      await this.notificationCenterService.publishEvent({
        event: {
          tenantId: requireTenantId(actor),
          eventType: "LEAD_REMINDER",
          domain: "SCRM",
          sourceType: "lead-follow-up",
          sourceId: followUp.id,
          title: "线索跟进提醒",
          summary: followUp.content,
          priority: this.resolveReminderPriority(remindAt),
          payload: {
            leadId: id,
            followUpId: followUp.id
          },
          targetPath: "/scrm/leads",
          targetLabel: "进入线索中心",
          actorId: actor.id,
          occurredAt: remindAt
        },
        recipientIds: [lead.ownerId],
        nudgeBaseAt: remindAt
      });
    }

    return mapLeadFollowUp(followUp);
  }

  async pendingReminders(query: ListLeadRemindersDto, actor: AuthUser) {
    const ownerFilter = await this.dataScopeService.buildScopedOwnerFilter(actor, query.ownerId);
    const pagination = getPaginationParams(query);
    const sort = resolveSort(query, REMINDER_SORT_FIELDS, REMINDER_DEFAULT_SORT);
    const where: Prisma.ReminderWhereInput = {
      ...ownerFilter,
      // 提醒面板默认只看待处理项；只有调用方显式传状态时才放宽查询范围。
      status: query.status ?? ReminderStatus.PENDING
    };
    const orderBy: Prisma.ReminderOrderByWithRelationInput[] = [
      { [sort.field]: sort.order } as Prisma.ReminderOrderByWithRelationInput,
      { id: "desc" }
    ];
    const { items, total } = await this.leadsRepository.listPendingReminders(
      requireTenantId(actor),
      where,
      orderBy,
      pagination
    );
    const response = mapPaginatedLeadReminders(items, total, pagination, sort);

    response.items = response.items.map((item) => this.accessPolicyService.sanitizeReadFields(actor, "lead", item));
    return response;
  }

  private async assertLeadAccessible(ownerId: string, actor: AuthUser) {
    await this.dataScopeService.assertOwnerAccessible(actor, ownerId, "You do not have access to this lead.");
  }

  private resolveReminderPriority(referenceAt: Date) {
    const diff = referenceAt.getTime() - Date.now();

    if (diff <= 1000 * 60 * 60 * 24) {
      return "HIGH" as const;
    }

    if (diff <= 1000 * 60 * 60 * 24 * 3) {
      return "MEDIUM" as const;
    }

    return "LOW" as const;
  }
}
