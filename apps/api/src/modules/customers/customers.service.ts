import { Injectable } from "@nestjs/common";
import { AuditActionType, FollowUpEntityType, Prisma } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { DataScopeService } from "../../common/data-scope/data-scope.service";
import {
  buildPaginatedResponse,
  getPaginationParams,
  resolveSort
} from "../../common/pagination/pagination.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { CreateCustomerFollowUpDto } from "./dto/create-customer-follow-up.dto";
import { CreateCustomerTagDto } from "./dto/create-customer-tag.dto";
import { CUSTOMER_SORT_FIELDS, type CustomerSortField, ListCustomersDto } from "./dto/list-customers.dto";
import { ReassignCustomerOwnerDto } from "./dto/reassign-customer-owner.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { UpdateCustomerTagsDto } from "./dto/update-customer-tags.dto";
import {
  mapCustomer,
  mapCustomerFollowUp,
  mapCustomerTag,
  mapPaginatedCustomers
} from "./mappers/customers.mapper";
import { CustomersRepository } from "./repositories/customers.repository";

const CUSTOMER_DEFAULT_SORT: { field: CustomerSortField; order: Prisma.SortOrder } = {
  field: "createdAt",
  order: "desc"
};

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataScopeService: DataScopeService
  ) {}

  async list(query: ListCustomersDto, actor: AuthUser) {
    const ownerFilter = await this.dataScopeService.buildScopedOwnerFilter(actor, query.ownerId);
    const pagination = getPaginationParams(query);
    const sort = resolveSort(query, CUSTOMER_SORT_FIELDS, CUSTOMER_DEFAULT_SORT);
    const where: Prisma.CustomerWhereInput = {
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
    };
    const orderBy: Prisma.CustomerOrderByWithRelationInput[] = [
      { [sort.field]: sort.order } as Prisma.CustomerOrderByWithRelationInput,
      { id: "desc" }
    ];
    const { items, total } = await this.customersRepository.list(where, orderBy, pagination);

    return mapPaginatedCustomers(items, total, pagination, sort);
  }

  async detail(id: string, actor: AuthUser) {
    const customer = await this.customersRepository.findDetailById(id);

    await this.assertCustomerAccessible(customer.ownerId, actor);
    return mapCustomer(customer);
  }

  async create(dto: CreateCustomerDto, actor: AuthUser) {
    if (dto.ownerId) {
      await this.dataScopeService.assertOwnerAccessible(
        actor,
        dto.ownerId,
        "You cannot assign customers outside your data scope."
      );
    }

    const customer = await this.customersRepository.createCustomer({
      name: dto.name,
      contactName: dto.contactName,
      phone: dto.phone,
      email: dto.email,
      source: dto.source,
      status: dto.status,
      notes: dto.notes,
      ownerId: dto.ownerId ?? actor.id,
      tagIds: dto.tagIds
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "customer",
      targetId: customer.id
    });

    return mapCustomer(customer);
  }

  async update(id: string, dto: UpdateCustomerDto, actor: AuthUser) {
    const existing = await this.customersRepository.findOwnerById(id);

    await this.assertCustomerAccessible(existing.ownerId, actor);

    if (dto.ownerId) {
      await this.dataScopeService.assertOwnerAccessible(
        actor,
        dto.ownerId,
        "You cannot assign customers outside your data scope."
      );
    }

    const customer = await this.customersRepository.updateCustomer(id, {
      name: dto.name,
      contactName: dto.contactName,
      phone: dto.phone,
      email: dto.email,
      source: dto.source,
      status: dto.status,
      notes: dto.notes,
      ownerId: dto.ownerId,
      tagIds: dto.tagIds
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "customer",
      targetId: customer.id
    });

    return mapCustomer(customer);
  }

  async listTags() {
    const tags = await this.customersRepository.listTags();

    return tags.map((tag) => mapCustomerTag(tag));
  }

  async createTag(dto: CreateCustomerTagDto, actor: AuthUser) {
    const tag = await this.customersRepository.createTag({
      name: dto.name,
      color: dto.color
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "customer-tag",
      targetId: tag.id
    });

    return mapCustomerTag(tag);
  }

  async updateTags(id: string, dto: UpdateCustomerTagsDto, actor: AuthUser) {
    const customer = await this.customersRepository.findOwnerById(id);

    await this.assertCustomerAccessible(customer.ownerId, actor);

    await this.customersRepository.replaceCustomerTags(id, dto.tagIds);

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
    const customer = await this.customersRepository.findOwnerById(id);

    await this.assertCustomerAccessible(customer.ownerId, actor);
    await this.dataScopeService.assertOwnerAccessible(
      actor,
      dto.ownerId,
      "You cannot assign customers outside your data scope."
    );

    const updated = await this.customersRepository.updateOwner(id, dto.ownerId);

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

    return mapCustomer(updated);
  }

  async listFollowUps(id: string, actor: AuthUser) {
    const customer = await this.customersRepository.findOwnerById(id);

    await this.assertCustomerAccessible(customer.ownerId, actor);

    const followUps = await this.customersRepository.listFollowUps(id);

    return followUps.map((followUp) => mapCustomerFollowUp(followUp));
  }

  async createFollowUp(id: string, dto: CreateCustomerFollowUpDto, actor: AuthUser) {
    const customer = await this.customersRepository.findOwnerById(id);

    await this.assertCustomerAccessible(customer.ownerId, actor);

    const followUp = await this.customersRepository.createFollowUp({
      customerId: id,
      ownerId: customer.ownerId,
      createdById: actor.id,
      content: dto.content,
      nextFollowUpAt: dto.nextFollowUpAt,
      entityType: FollowUpEntityType.CUSTOMER
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "customer-followup",
      targetId: followUp.id
    });

    return mapCustomerFollowUp(followUp);
  }

  private async assertCustomerAccessible(ownerId: string, actor: AuthUser) {
    await this.dataScopeService.assertOwnerAccessible(actor, ownerId, "You do not have access to this customer.");
  }
}
