import { ForbiddenException, Injectable } from "@nestjs/common";
import { AuditActionType, FollowUpEntityType, LeadStatus, ReminderStatus } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { CreateLeadFollowUpDto } from "./dto/create-lead-follow-up.dto";
import { ListLeadsDto } from "./dto/list-leads.dto";
import { ReassignLeadOwnerDto } from "./dto/reassign-lead-owner.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list(query: ListLeadsDto, actor: AuthUser) {
    const ownerFilter = await this.buildScopedOwnerFilter(actor, query.ownerId);

    return this.prisma.lead.findMany({
      where: {
        ...ownerFilter,
        source: query.source,
        status: query.status as LeadStatus | undefined,
        OR: query.keyword
          ? [
              { name: { contains: query.keyword, mode: "insensitive" } },
              { contactName: { contains: query.keyword, mode: "insensitive" } },
              { phone: { contains: query.keyword, mode: "insensitive" } }
            ]
          : undefined
      },
      include: {
        owner: true,
        convertedCustomer: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
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

  async pendingReminders(actor: AuthUser) {
    const ownerIds = actor.roleCodes.includes("super-admin")
      ? undefined
      : actor.roleCodes.includes("sales-manager") && actor.departmentId
        ? {
            in: (
              await this.prisma.user.findMany({
                where: { departmentId: actor.departmentId },
                select: { id: true }
              })
            ).map((item) => item.id)
          }
        : actor.id;

    return this.prisma.reminder.findMany({
      where: {
        status: ReminderStatus.PENDING,
        ownerId: ownerIds as string | { in: string[] } | undefined
      },
      include: {
        lead: true,
        customer: true,
        followUp: true,
        owner: true
      },
      orderBy: {
        remindAt: "asc"
      }
    });
  }

  private async buildScopedOwnerFilter(actor: AuthUser, requestedOwnerId?: string) {
    if (actor.roleCodes.includes("super-admin")) {
      return requestedOwnerId ? { ownerId: requestedOwnerId } : {};
    }

    const accessibleOwnerIds = await this.getAccessibleOwnerIds(actor);

    if (requestedOwnerId) {
      return {
        ownerId: accessibleOwnerIds.includes(requestedOwnerId) ? requestedOwnerId : "__no_match__"
      };
    }

    return {
      ownerId: {
        in: accessibleOwnerIds
      }
    };
  }

  private async assertLeadAccessible(ownerId: string, actor: AuthUser) {
    if (actor.roleCodes.includes("super-admin")) {
      return;
    }

    const accessibleOwnerIds = await this.getAccessibleOwnerIds(actor);

    if (!accessibleOwnerIds.includes(ownerId)) {
      throw new ForbiddenException("You do not have access to this lead.");
    }
  }

  private async getAccessibleOwnerIds(actor: AuthUser): Promise<string[]> {
    if (actor.roleCodes.includes("sales-manager") && actor.departmentId) {
      const teamUsers = await this.prisma.user.findMany({
        where: {
          departmentId: actor.departmentId
        },
        select: {
          id: true
        }
      });

      return teamUsers.map((item) => item.id);
    }

    return [actor.id];
  }
}

