import { ForbiddenException, Injectable } from "@nestjs/common";
import { AuditActionType, FollowUpEntityType, LeadStatus, Prisma, ReminderStatus } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { DataScopeService } from "../../common/data-scope/data-scope.service";
import {
  buildPaginatedResponse,
  getPaginationParams,
  resolveSort
} from "../../common/pagination/pagination.util";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { CreateLeadFollowUpDto } from "./dto/create-lead-follow-up.dto";
import { ListLeadRemindersDto, REMINDER_SORT_FIELDS, type ReminderSortField } from "./dto/list-lead-reminders.dto";
import { LEAD_SORT_FIELDS, type LeadSortField, ListLeadsDto } from "./dto/list-leads.dto";
import { ReassignLeadOwnerDto } from "./dto/reassign-lead-owner.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";

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
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataScopeService: DataScopeService
  ) {}

  async list(query: ListLeadsDto, actor: AuthUser) {
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
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        include: {
          owner: true,
          convertedCustomer: true
        },
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.lead.count({ where })
    ]);

    return buildPaginatedResponse(items, total, pagination, sort);
  }

  async detail(id: string, actor: AuthUser) {
    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id },
      include: {
        owner: true,
        convertedCustomer: true,
        attachments: true
      }
    });

    await this.assertLeadAccessible(lead.ownerId, actor);
    return lead;
  }

  async create(dto: CreateLeadDto, actor: AuthUser) {
    if (dto.ownerId) {
      await this.dataScopeService.assertOwnerAccessible(
        actor,
        dto.ownerId,
        "You cannot assign leads outside your data scope."
      );
    }

    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        contactName: dto.contactName,
        phone: dto.phone,
        source: dto.source,
        notes: dto.notes,
        ownerId: dto.ownerId ?? actor.id
      },
      include: {
        owner: true
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "lead",
      targetId: lead.id
    });

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, actor: AuthUser) {
    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id }
    });

    await this.assertLeadAccessible(lead.ownerId, actor);

    if (dto.ownerId) {
      await this.dataScopeService.assertOwnerAccessible(
        actor,
        dto.ownerId,
        "You cannot assign leads outside your data scope."
      );
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        name: dto.name,
        contactName: dto.contactName,
        phone: dto.phone,
        source: dto.source,
        notes: dto.notes,
        ownerId: dto.ownerId,
        status: dto.status
      },
      include: {
        owner: true,
        convertedCustomer: true
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "lead",
      targetId: updated.id
    });

    return updated;
  }

  async reassignOwner(id: string, dto: ReassignLeadOwnerDto, actor: AuthUser) {
    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id }
    });

    await this.assertLeadAccessible(lead.ownerId, actor);
    await this.dataScopeService.assertOwnerAccessible(
      actor,
      dto.ownerId,
      "You cannot assign leads outside your data scope."
    );

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ownerId: dto.ownerId
      },
      include: {
        owner: true
      }
    });

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

    return updated;
  }

  async convert(id: string, actor: AuthUser) {
    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id }
    });

    await this.assertLeadAccessible(lead.ownerId, actor);

    if (lead.status === LeadStatus.CONVERTED || lead.convertedCustomerId) {
      throw new ForbiddenException("This lead has already been converted.");
    }

    const customer = await this.prisma.$transaction(async (tx) => {
      const createdCustomer = await tx.customer.create({
        data: {
          name: lead.name,
          contactName: lead.contactName,
          phone: lead.phone,
          source: lead.source,
          status: "new",
          notes: lead.notes,
          ownerId: lead.ownerId
        }
      });

      await tx.lead.update({
        where: { id },
        data: {
          status: LeadStatus.CONVERTED,
          convertedCustomerId: createdCustomer.id
        }
      });

      return createdCustomer;
    });

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
    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id }
    });

    await this.assertLeadAccessible(lead.ownerId, actor);

    return this.prisma.followUp.findMany({
      where: {
        leadId: id
      },
      include: {
        createdBy: true,
        reminder: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async createFollowUp(id: string, dto: CreateLeadFollowUpDto, actor: AuthUser) {
    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id }
    });

    await this.assertLeadAccessible(lead.ownerId, actor);

    const followUp = await this.prisma.$transaction(async (tx) => {
      const created = await tx.followUp.create({
        data: {
          entityType: FollowUpEntityType.LEAD,
          leadId: id,
          createdById: actor.id,
          content: dto.content,
          nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : undefined
        }
      });

      if (dto.nextFollowUpAt) {
        await tx.reminder.create({
          data: {
            entityType: FollowUpEntityType.LEAD,
            leadId: id,
            followUpId: created.id,
            ownerId: lead.ownerId,
            remindAt: new Date(dto.nextFollowUpAt)
          }
        });
      }

      return tx.followUp.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          createdBy: true,
          reminder: true
        }
      });
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "lead-followup",
      targetId: followUp.id
    });

    return followUp;
  }

  async pendingReminders(query: ListLeadRemindersDto, actor: AuthUser) {
    const ownerFilter = await this.dataScopeService.buildScopedOwnerFilter(actor, query.ownerId);
    const pagination = getPaginationParams(query);
    const sort = resolveSort(query, REMINDER_SORT_FIELDS, REMINDER_DEFAULT_SORT);
    const where: Prisma.ReminderWhereInput = {
      ...ownerFilter,
      status: query.status ?? ReminderStatus.PENDING
    };
    const orderBy: Prisma.ReminderOrderByWithRelationInput[] = [
      { [sort.field]: sort.order } as Prisma.ReminderOrderByWithRelationInput,
      { id: "desc" }
    ];
    const [items, total] = await this.prisma.$transaction([
      this.prisma.reminder.findMany({
        where,
        include: {
          lead: true,
          customer: true,
          followUp: true,
          owner: true
        },
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.reminder.count({ where })
    ]);

    return buildPaginatedResponse(items, total, pagination, sort);
  }

  private async assertLeadAccessible(ownerId: string, actor: AuthUser) {
    await this.dataScopeService.assertOwnerAccessible(actor, ownerId, "You do not have access to this lead.");
  }
}
