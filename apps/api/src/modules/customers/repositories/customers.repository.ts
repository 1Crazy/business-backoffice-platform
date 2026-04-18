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
    tenantId: string,
    where: Prisma.CustomerWhereInput,
    orderBy: Prisma.CustomerOrderByWithRelationInput[],
    pagination: PaginationParams
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where: {
          AND: [{ tenantId }, where]
        },
        include: customerListInclude,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.customer.count({
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
    return this.prisma.customer.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      include: customerDetailInclude
    });
  }

  findOwnerById(id: string, tenantId: string) {
    return this.prisma.customer.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      select: {
        ownerId: true
      }
    });
  }

  async createCustomer(input: {
    tenantId: string;
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
          tenantId: input.tenantId,
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
    tenantId: string,
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
      await tx.customer.updateMany({
        where: {
          id,
          tenantId
        },
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

  listTags(tenantId: string) {
    return this.prisma.customerTag.findMany({
      where: {
        tenantId
      },
      orderBy: {
        name: "asc"
      }
    });
  }

  countTagsByIds(tenantId: string, tagIds: string[]) {
    return this.prisma.customerTag.count({
      where: {
        tenantId,
        id: {
          in: tagIds
        }
      }
    });
  }

  createTag(input: { tenantId: string; name: string; color?: string | null }) {
    return this.prisma.customerTag.create({
      data: {
        tenantId: input.tenantId,
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

  async updateOwner(customerId: string, tenantId: string, ownerId: string) {
    await this.prisma.customer.updateMany({
      where: {
        id: customerId,
        tenantId
      },
      data: {
        ownerId
      }
    });

    return this.findDetailById(customerId, tenantId);
  }

  listFollowUps(customerId: string, tenantId: string) {
    return this.prisma.followUp.findMany({
      where: {
        customerId,
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
          tenantId: input.tenantId,
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
            tenantId: input.tenantId,
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
