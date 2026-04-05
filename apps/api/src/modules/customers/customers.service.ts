import { ForbiddenException, Injectable } from "@nestjs/common";
import { AuditActionType, FollowUpEntityType } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { CreateCustomerFollowUpDto } from "./dto/create-customer-follow-up.dto";
import { CreateCustomerTagDto } from "./dto/create-customer-tag.dto";
import { ListCustomersDto } from "./dto/list-customers.dto";
import { ReassignCustomerOwnerDto } from "./dto/reassign-customer-owner.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { UpdateCustomerTagsDto } from "./dto/update-customer-tags.dto";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list(query: ListCustomersDto, actor: AuthUser) {
    const ownerFilter = await this.buildScopedOwnerFilter(actor, query.ownerId);

    return this.prisma.customer.findMany({
      where: {
        ...ownerFilter,
        source: query.source,
        status: query.status,
        OR: query.keyword
          ? [
              { name: { contains: query.keyword, mode: "insensitive" } },
              { contactName: { contains: query.keyword, mode: "insensitive" } },
              { phone: { contains: query.keyword, mode: "insensitive" } },
              { email: { contains: query.keyword, mode: "insensitive" } }
            ]
          : undefined,
        tags: query.tagId
          ? {
              some: {
                tagId: query.tagId
              }
            }
          : undefined
      },
      include: {
        owner: true,
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async detail(id: string, actor: AuthUser) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id },
      include: {
        owner: true,
        tags: {
          include: {
            tag: true
          }
        },
        attachments: true
      }
    });

    await this.assertCustomerAccessible(customer.ownerId, actor);
    return customer;
  }

  async create(dto: CreateCustomerDto, actor: AuthUser) {
    const customer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          name: dto.name,
          contactName: dto.contactName,
          phone: dto.phone,
          email: dto.email,
          source: dto.source,
          status: dto.status,
          notes: dto.notes,
          ownerId: dto.ownerId ?? actor.id
        }
      });

      if (dto.tagIds?.length) {
        await tx.customerTagOnCustomer.createMany({
          data: dto.tagIds.map((tagId) => ({
            customerId: created.id,
            tagId
          }))
        });
      }

      return tx.customer.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          owner: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "customer",
      targetId: customer.id
    });

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, actor: AuthUser) {
    const existing = await this.prisma.customer.findUniqueOrThrow({
      where: { id }
    });

    await this.assertCustomerAccessible(existing.ownerId, actor);

    const customer = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { id },
        data: {
          name: dto.name,
          contactName: dto.contactName,
          phone: dto.phone,
          email: dto.email,
          source: dto.source,
          status: dto.status,
          notes: dto.notes,
          ownerId: dto.ownerId
        }
      });

      if (dto.tagIds) {
        await tx.customerTagOnCustomer.deleteMany({
          where: { customerId: id }
        });
        if (dto.tagIds.length) {
          await tx.customerTagOnCustomer.createMany({
            data: dto.tagIds.map((tagId) => ({
              customerId: id,
              tagId
            }))
          });
        }
      }

      return tx.customer.findUniqueOrThrow({
        where: { id: updated.id },
        include: {
          owner: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "customer",
      targetId: customer.id
    });

    return customer;
  }

  async listTags() {
    return this.prisma.customerTag.findMany({
      orderBy: {
        name: "asc"
      }
    });
  }

  async createTag(dto: CreateCustomerTagDto, actor: AuthUser) {
    const tag = await this.prisma.customerTag.create({
      data: {
        name: dto.name,
        color: dto.color
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "customer-tag",
      targetId: tag.id
    });

    return tag;
  }

  async updateTags(id: string, dto: UpdateCustomerTagsDto, actor: AuthUser) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id }
    });

    await this.assertCustomerAccessible(customer.ownerId, actor);

    await this.prisma.$transaction(async (tx) => {
      await tx.customerTagOnCustomer.deleteMany({
        where: { customerId: id }
      });

      if (dto.tagIds.length) {
        await tx.customerTagOnCustomer.createMany({
          data: dto.tagIds.map((tagId) => ({
            customerId: id,
            tagId
          }))
        });
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "customer-tags",
      targetId: id
    });

    return this.detail(id, actor);
  }

  async reassignOwner(id: string, dto: ReassignCustomerOwnerDto, actor: AuthUser) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id }
    });

    await this.assertCustomerAccessible(customer.ownerId, actor);

    const updated = await this.prisma.customer.update({
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
      targetType: "customer",
      targetId: id,
      detail: {
        fromOwnerId: customer.ownerId,
        toOwnerId: dto.ownerId
      }
    });

    return updated;
  }

  async listFollowUps(id: string, actor: AuthUser) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id }
    });

    await this.assertCustomerAccessible(customer.ownerId, actor);

    return this.prisma.followUp.findMany({
      where: {
        customerId: id
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

  async createFollowUp(id: string, dto: CreateCustomerFollowUpDto, actor: AuthUser) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id }
    });

    await this.assertCustomerAccessible(customer.ownerId, actor);

    const followUp = await this.prisma.$transaction(async (tx) => {
      const created = await tx.followUp.create({
        data: {
          entityType: FollowUpEntityType.CUSTOMER,
          customerId: id,
          createdById: actor.id,
          content: dto.content,
          nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : undefined
        }
      });

      if (dto.nextFollowUpAt) {
        await tx.reminder.create({
          data: {
            entityType: FollowUpEntityType.CUSTOMER,
            customerId: id,
            followUpId: created.id,
            ownerId: customer.ownerId,
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
      targetType: "customer-followup",
      targetId: followUp.id
    });

    return followUp;
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

  private async assertCustomerAccessible(ownerId: string, actor: AuthUser) {
    if (actor.roleCodes.includes("super-admin")) {
      return;
    }

    const accessibleOwnerIds = await this.getAccessibleOwnerIds(actor);

    if (!accessibleOwnerIds.includes(ownerId)) {
      throw new ForbiddenException("You do not have access to this customer.");
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

