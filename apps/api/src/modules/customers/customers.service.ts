/** customers 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { ForbiddenException, Injectable } from "@nestjs/common";
import { AuditActionType, FollowUpEntityType, Prisma } from "@prisma/client";

import { AccessPolicyService } from "@/common/access-policy/access-policy.service";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { DataScopeService } from "@/common/data-scope/data-scope.service";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { getPaginationParams, resolveSort } from "@/common/pagination/pagination.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { NotificationCenterService } from "../notification-center/notification-center.service";
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
    private readonly dataScopeService: DataScopeService,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly notificationCenterService: NotificationCenterService
  ) {}

  async list(query: ListCustomersDto, actor: AuthUser) {
    // 列表查询始终先经过数据范围过滤，再叠加页面筛选，避免前端通过组合参数绕过权限边界。
    const customerScopeFilter = await this.dataScopeService.buildScopedCustomerFilter(actor, query.ownerId);
    const pagination = getPaginationParams(query);
    const sort = resolveSort(query, CUSTOMER_SORT_FIELDS, CUSTOMER_DEFAULT_SORT);
    const where: Prisma.CustomerWhereInput = {
      ...customerScopeFilter,
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
    const { items, total } = await this.customersRepository.list(requireTenantId(actor), where, orderBy, pagination);
    const response = mapPaginatedCustomers(items, total, pagination, sort);

    response.items = response.items.map((item) => this.accessPolicyService.sanitizeReadFields(actor, "customer", item));
    return response;
  }

  async detail(id: string, actor: AuthUser) {
    await this.assertCustomerAccessible(id, actor);
    const customer = await this.customersRepository.findDetailById(id, requireTenantId(actor));

    return this.accessPolicyService.sanitizeReadFields(actor, "customer", mapCustomer(customer));
  }

  async create(dto: CreateCustomerDto, actor: AuthUser) {
    this.accessPolicyService.assertWritableFields(actor, "customer", {
      ...dto,
      tags: dto.tagIds
    });

    if (dto.ownerId) {
      await this.dataScopeService.assertOwnerAccessible(
        actor,
        dto.ownerId,
        "You cannot assign customers outside your data scope."
      );
    }

    const customer = await this.customersRepository.createCustomer({
      tenantId: requireTenantId(actor),
      name: dto.name,
      contactName: dto.contactName,
      phone: dto.phone,
      email: dto.email,
      source: dto.source,
      status: dto.status,
      notes: dto.notes,
      // 创建时未显式指定负责人，就默认归到当前操作人，避免产生无归属数据。
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

    return this.accessPolicyService.sanitizeReadFields(actor, "customer", mapCustomer(customer));
  }

  async update(id: string, dto: UpdateCustomerDto, actor: AuthUser) {
    await this.assertCustomerAccessible(id, actor);
    this.accessPolicyService.assertWritableFields(actor, "customer", {
      ...dto,
      tags: dto.tagIds
    });

    if (dto.ownerId) {
      await this.dataScopeService.assertOwnerAccessible(
        actor,
        dto.ownerId,
        "You cannot assign customers outside your data scope."
      );
    }

    // 更新接口允许显式传 null 清空可选字段，因此这里不能再套用创建时的“缺省即忽略”语义。
    const customer = await this.customersRepository.updateCustomer(id, requireTenantId(actor), {
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

    return this.accessPolicyService.sanitizeReadFields(actor, "customer", mapCustomer(customer));
  }

  async listTags(actor: AuthUser) {
    const tags = await this.customersRepository.listTags(requireTenantId(actor));

    return tags.map((tag) => mapCustomerTag(tag));
  }

  async createTag(dto: CreateCustomerTagDto, actor: AuthUser) {
    const tag = await this.customersRepository.createTag({
      tenantId: requireTenantId(actor),
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
    await this.assertCustomerAccessible(id, actor);
    this.accessPolicyService.assertWritableFields(actor, "customer", {
      tags: dto.tagIds
    });

    const tenantId = requireTenantId(actor);

    if (dto.tagIds.length > 0) {
      const matchedTagCount = await this.customersRepository.countTagsByIds(tenantId, dto.tagIds);

      if (matchedTagCount !== dto.tagIds.length) {
        throw new ForbiddenException("不允许绑定跨租户标签。");
      }
    }

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
    const customer = await this.customersRepository.findOwnerById(id, requireTenantId(actor));

    await this.assertCustomerAccessible(id, actor);
    await this.dataScopeService.assertOwnerAccessible(
      actor,
      dto.ownerId,
      "You cannot assign customers outside your data scope."
    );

    const updated = await this.customersRepository.updateOwner(id, requireTenantId(actor), dto.ownerId);

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

    return this.accessPolicyService.sanitizeReadFields(actor, "customer", mapCustomer(updated));
  }

  async listFollowUps(id: string, actor: AuthUser) {
    await this.assertCustomerAccessible(id, actor);

    const followUps = await this.customersRepository.listFollowUps(id, requireTenantId(actor));

    return followUps.map((followUp) => mapCustomerFollowUp(followUp));
  }

  async createFollowUp(id: string, dto: CreateCustomerFollowUpDto, actor: AuthUser) {
    const customer = await this.customersRepository.findOwnerById(id, requireTenantId(actor));

    await this.assertCustomerAccessible(id, actor);

    // 跟进记录需要继承当前客户归属人，后续提醒与数据范围校验都依赖这个 ownerId。
    const followUp = await this.customersRepository.createFollowUp({
      tenantId: requireTenantId(actor),
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

    if (dto.nextFollowUpAt) {
      const remindAt = new Date(dto.nextFollowUpAt);

      await this.notificationCenterService.publishEvent({
        event: {
          tenantId: requireTenantId(actor),
          eventType: "CUSTOMER_REMINDER",
          domain: "SCRM",
          sourceType: "customer-follow-up",
          sourceId: followUp.id,
          title: "客户跟进提醒",
          summary: followUp.content,
          priority: this.resolveReminderPriority(remindAt),
          payload: {
            customerId: id,
            followUpId: followUp.id
          },
          targetPath: `/scrm/customers?customerId=${id}&drawer=follow-up`,
          targetLabel: "进入客户跟进",
          actorId: actor.id,
          occurredAt: remindAt
        },
        recipientIds: [customer.ownerId],
        nudgeBaseAt: remindAt
      });
    }

    return mapCustomerFollowUp(followUp);
  }

  private async assertCustomerAccessible(customerId: string, actor: AuthUser) {
    await this.dataScopeService.assertCustomerAccessible(actor, customerId, "You do not have access to this customer.");
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
