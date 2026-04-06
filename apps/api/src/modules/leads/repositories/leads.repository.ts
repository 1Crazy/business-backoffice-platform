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
    where: Prisma.LeadWhereInput,
    orderBy: Prisma.LeadOrderByWithRelationInput[],
    pagination: PaginationParams
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        include: leadListInclude,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.lead.count({ where })
    ]);

    return {
      items,
      total
    };
  }

  async listPendingReminders(
    where: Prisma.ReminderWhereInput,
    orderBy: Prisma.ReminderOrderByWithRelationInput[],
    pagination: PaginationParams
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.reminder.findMany({
        where,
        include: reminderInclude,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.reminder.count({ where })
    ]);

    return {
      items,
      total
    };
  }

  findDetailById(id: string) {
    return this.prisma.lead.findUniqueOrThrow({
      where: { id },
      include: leadDetailInclude
    });
  }

  findOwnerById(id: string) {
    return this.prisma.lead.findUniqueOrThrow({
      where: { id },
      select: {
        ownerId: true
      }
    });
  }

  findSnapshotById(id: string): Promise<LeadSnapshotRecord> {
    return this.prisma.lead.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
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
    name: string;
    contactName?: string | null;
    phone?: string | null;
    source?: string | null;
    notes?: string | null;
    ownerId: string;
  }) {
    const lead = await this.prisma.lead.create({
      data: {
        name: input.name,
        contactName: input.contactName ?? undefined,
        phone: input.phone ?? undefined,
        source: input.source ?? undefined,
        notes: input.notes ?? undefined,
        ownerId: input.ownerId
      }
    });

    return this.findDetailById(lead.id);
  }

  async updateLead(
    id: string,
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
    await this.prisma.lead.update({
      where: { id },
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

    return this.findDetailById(id);
  }

  async updateOwner(id: string, ownerId: string) {
    await this.prisma.lead.update({
      where: { id },
      data: {
        ownerId
      }
    });

    return this.findDetailById(id);
  }

  convertLeadToCustomer(lead: LeadSnapshotRecord) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
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
        where: { id: lead.id },
        data: {
          status: "CONVERTED",
          convertedCustomerId: customer.id
        }
      });

      return customer;
    });
  }

  listFollowUps(leadId: string) {
    return this.prisma.followUp.findMany({
      where: {
        leadId
      },
      include: followUpInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  createFollowUp(input: {
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
