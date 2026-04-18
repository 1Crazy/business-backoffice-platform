/** leads 模块 repository：负责 leads 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma, type FollowUpEntityType, type LeadStatus, type ReminderStatus } from "@prisma/client";

import type { PaginationParams } from "@/common/pagination/pagination.util";
import { PrismaService } from "@/common/prisma/prisma.service";

const leadListInclude = Prisma.validator<Prisma.LeadInclude>()({
  owner: true,
  convertedCustomer: true
});

const leadDetailInclude = Prisma.validator<Prisma.LeadInclude>()({
  ...leadListInclude,
  attachments: true
});

const followUpInclude = Prisma.validator<Prisma.FollowUpInclude>()({
  createdBy: true,
  reminder: true
});

const reminderInclude = Prisma.validator<Prisma.ReminderInclude>()({
  lead: true,
  customer: true,
  followUp: true,
  owner: true
});

export type LeadListRecord = Prisma.LeadGetPayload<{
  include: typeof leadListInclude;
}>;

export type LeadDetailRecord = Prisma.LeadGetPayload<{
  include: typeof leadDetailInclude;
}>;

export type LeadFollowUpRecord = Prisma.FollowUpGetPayload<{
  include: typeof followUpInclude;
}>;

export type LeadReminderRecord = Prisma.ReminderGetPayload<{
  include: typeof reminderInclude;
}>;

type LeadSnapshotRecord = Prisma.LeadGetPayload<{
  select: {
    id: true;
    tenantId: true;
    name: true;
    contactName: true;
    phone: true;
    source: true;
    status: true;
    notes: true;
    ownerId: true;
    convertedCustomerId: true;
  };
}>;

@Injectable()
export class LeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenantId: string,
    where: Prisma.LeadWhereInput,
    orderBy: Prisma.LeadOrderByWithRelationInput[],
    pagination: PaginationParams
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where: {
          AND: [{ tenantId }, where]
        },
        include: leadListInclude,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.lead.count({
        where: {
          AND: [{ tenantId }, where]
        }
      })
    ]);

    return {
      items,
      total
    };
  }

  async listPendingReminders(
    tenantId: string,
    where: Prisma.ReminderWhereInput,
    orderBy: Prisma.ReminderOrderByWithRelationInput[],
    pagination: PaginationParams
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.reminder.findMany({
        where: {
          AND: [{ tenantId }, where]
        },
        include: reminderInclude,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.reminder.count({
        where: {
          AND: [{ tenantId }, where]
        }
      })
    ]);

    return {
      items,
      total
    };
  }

  findDetailById(id: string, tenantId: string) {
    return this.prisma.lead.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      include: leadDetailInclude
    });
  }

  findOwnerById(id: string, tenantId: string) {
    return this.prisma.lead.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      select: {
        ownerId: true
      }
    });
  }

  findSnapshotById(id: string, tenantId: string): Promise<LeadSnapshotRecord> {
    return this.prisma.lead.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        contactName: true,
        phone: true,
        source: true,
        status: true,
        notes: true,
        ownerId: true,
        convertedCustomerId: true
      }
    });
  }

  async createLead(input: {
    tenantId: string;
    name: string;
    contactName?: string | null;
    phone?: string | null;
    source?: string | null;
    notes?: string | null;
    ownerId: string;
  }) {
    const lead = await this.prisma.lead.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        contactName: input.contactName ?? undefined,
        phone: input.phone ?? undefined,
        source: input.source ?? undefined,
        notes: input.notes ?? undefined,
        ownerId: input.ownerId
      }
    });

    return this.findDetailById(lead.id, input.tenantId);
  }

  async updateLead(
    id: string,
    tenantId: string,
    input: {
      name?: string;
      contactName?: string | null;
      phone?: string | null;
      source?: string | null;
      notes?: string | null;
      ownerId?: string;
      status?: LeadStatus;
    }
  ) {
    await this.prisma.lead.updateMany({
      where: {
        id,
        tenantId
      },
      data: {
        name: input.name,
        contactName: input.contactName,
        phone: input.phone,
        source: input.source,
        notes: input.notes,
        ownerId: input.ownerId,
        status: input.status
      }
    });

    return this.findDetailById(id, tenantId);
  }

  async updateOwner(id: string, tenantId: string, ownerId: string) {
    await this.prisma.lead.updateMany({
      where: {
        id,
        tenantId
      },
      data: {
        ownerId
      }
    });

    return this.findDetailById(id, tenantId);
  }

  convertLeadToCustomer(lead: LeadSnapshotRecord & { tenantId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          tenantId: lead.tenantId,
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
        where: { id: lead.id },
        data: {
          status: "CONVERTED",
          convertedCustomerId: customer.id
        }
      });

      return customer;
    });
  }

  listFollowUps(leadId: string, tenantId: string) {
    return this.prisma.followUp.findMany({
      where: {
        leadId,
        tenantId
      },
      include: followUpInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  createFollowUp(input: {
    tenantId: string;
    leadId: string;
    ownerId: string;
    createdById: string;
    content: string;
    nextFollowUpAt?: string;
    entityType: FollowUpEntityType;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.followUp.create({
        data: {
          tenantId: input.tenantId,
          entityType: input.entityType,
          leadId: input.leadId,
          createdById: input.createdById,
          content: input.content,
          nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : undefined
        }
      });

      if (input.nextFollowUpAt) {
        await tx.reminder.create({
          data: {
            tenantId: input.tenantId,
            entityType: input.entityType,
            leadId: input.leadId,
            followUpId: created.id,
            ownerId: input.ownerId,
            remindAt: new Date(input.nextFollowUpAt)
          }
        });
      }

      return tx.followUp.findUniqueOrThrow({
        where: { id: created.id },
        include: followUpInclude
      });
    });
  }
}
