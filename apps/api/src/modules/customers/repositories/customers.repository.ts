/** customers 模块 repository：负责 customers 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma, type FollowUpEntityType } from "@prisma/client";

import type { PaginationParams } from "@/common/pagination/pagination.util";
import { PrismaService } from "@/common/prisma/prisma.service";

const customerListInclude = Prisma.validator<Prisma.CustomerInclude>()({
  owner: true,
  tags: {
    include: {
      tag: true
    }
  }
});

const customerDetailInclude = Prisma.validator<Prisma.CustomerInclude>()({
  ...customerListInclude,
  attachments: true
});

const followUpInclude = Prisma.validator<Prisma.FollowUpInclude>()({
  createdBy: true,
  reminder: true
});

export type CustomerListRecord = Prisma.CustomerGetPayload<{
  include: typeof customerListInclude;
}>;

export type CustomerDetailRecord = Prisma.CustomerGetPayload<{
  include: typeof customerDetailInclude;
}>;

export type CustomerTagRecord = Prisma.CustomerTagGetPayload<Record<string, never>>;

export type CustomerFollowUpRecord = Prisma.FollowUpGetPayload<{
  include: typeof followUpInclude;
}>;

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    where: Prisma.CustomerWhereInput,
    orderBy: Prisma.CustomerOrderByWithRelationInput[],
    pagination: PaginationParams
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        include: customerListInclude,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.customer.count({ where })
    ]);

    return {
      items,
      total
    };
  }

  findDetailById(id: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id },
      include: customerDetailInclude
    });
  }

  findOwnerById(id: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id },
      select: {
        ownerId: true
      }
    });
  }

  async createCustomer(input: {
    name: string;
    contactName?: string | null;
    phone?: string | null;
    email?: string | null;
    source?: string | null;
    status?: string | null;
    notes?: string | null;
    ownerId: string;
    tagIds?: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          name: input.name,
          contactName: input.contactName ?? undefined,
          phone: input.phone ?? undefined,
          email: input.email ?? undefined,
          source: input.source ?? undefined,
          status: input.status ?? undefined,
          notes: input.notes ?? undefined,
          ownerId: input.ownerId
        }
      });

      if (input.tagIds?.length) {
        await tx.customerTagOnCustomer.createMany({
          data: input.tagIds.map((tagId) => ({
            customerId: created.id,
            tagId
          }))
        });
      }

      return tx.customer.findUniqueOrThrow({
        where: { id: created.id },
        include: customerDetailInclude
      });
    });
  }

  async updateCustomer(
    id: string,
    input: {
      name?: string;
      contactName?: string | null;
      phone?: string | null;
      email?: string | null;
      source?: string | null;
      status?: string | null;
      notes?: string | null;
      ownerId?: string;
      tagIds?: string[];
    }
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: {
          name: input.name,
          contactName: input.contactName,
          phone: input.phone,
          email: input.email,
          source: input.source,
          status: input.status,
          notes: input.notes,
          ownerId: input.ownerId
        }
      });

      if (input.tagIds) {
        await tx.customerTagOnCustomer.deleteMany({
          where: { customerId: id }
        });

        if (input.tagIds.length) {
          await tx.customerTagOnCustomer.createMany({
            data: input.tagIds.map((tagId) => ({
              customerId: id,
              tagId
            }))
          });
        }
      }

      return tx.customer.findUniqueOrThrow({
        where: { id },
        include: customerDetailInclude
      });
    });
  }

  listTags() {
    return this.prisma.customerTag.findMany({
      orderBy: {
        name: "asc"
      }
    });
  }

  createTag(input: { name: string; color?: string | null }) {
    return this.prisma.customerTag.create({
      data: {
        name: input.name,
        color: input.color ?? undefined
      }
    });
  }

  replaceCustomerTags(customerId: string, tagIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.customerTagOnCustomer.deleteMany({
        where: { customerId }
      });

      if (tagIds.length) {
        await tx.customerTagOnCustomer.createMany({
          data: tagIds.map((tagId) => ({
            customerId,
            tagId
          }))
        });
      }
    });
  }

  async updateOwner(customerId: string, ownerId: string) {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ownerId
      }
    });

    return this.findDetailById(customerId);
  }

  listFollowUps(customerId: string) {
    return this.prisma.followUp.findMany({
      where: {
        customerId
      },
      include: followUpInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  createFollowUp(input: {
    customerId: string;
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
          customerId: input.customerId,
          createdById: input.createdById,
          content: input.content,
          nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : undefined
        }
      });

      if (input.nextFollowUpAt) {
        await tx.reminder.create({
          data: {
            entityType: input.entityType,
            customerId: input.customerId,
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
