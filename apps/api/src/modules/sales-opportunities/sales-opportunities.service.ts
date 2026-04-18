/** sales-opportunities 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditActionType, OpportunityStage, Prisma } from "@prisma/client";

import { AccessPolicyService } from "@/common/access-policy/access-policy.service";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { DataScopeService } from "@/common/data-scope/data-scope.service";
import { getPaginationParams, resolveSort } from "@/common/pagination/pagination.util";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateSalesOpportunityDto } from "./dto/create-sales-opportunity.dto";
import {
  SALES_OPPORTUNITY_SORT_FIELDS,
  type SalesOpportunitySortField,
  ListSalesOpportunitiesDto
} from "./dto/list-sales-opportunities.dto";
import { MarkSalesOpportunityLostDto } from "./dto/mark-sales-opportunity-lost.dto";
import { MarkSalesOpportunityWonDto } from "./dto/mark-sales-opportunity-won.dto";
import { ReassignSalesOpportunityOwnerDto } from "./dto/reassign-sales-opportunity-owner.dto";
import { UpdateSalesOpportunityStageDto } from "./dto/update-sales-opportunity-stage.dto";
import { UpdateSalesOpportunityDto } from "./dto/update-sales-opportunity.dto";
import { mapPaginatedSalesOpportunities, mapSalesOpportunity } from "./mappers/sales-opportunities.mapper";
import { SalesOpportunitiesRepository } from "./repositories/sales-opportunities.repository";
import {
  OPPORTUNITY_CLOSED_STAGES,
  OPPORTUNITY_OPEN_STAGES,
  OpportunityResultStatus
} from "./sales-opportunity.constants";

const SALES_OPPORTUNITY_DEFAULT_SORT: { field: SalesOpportunitySortField; order: Prisma.SortOrder } = {
  field: "createdAt",
  order: "desc"
};

@Injectable()
export class SalesOpportunitiesService {
  constructor(
    private readonly salesOpportunitiesRepository: SalesOpportunitiesRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataScopeService: DataScopeService,
    private readonly accessPolicyService: AccessPolicyService
  ) {}

  async list(query: ListSalesOpportunitiesDto, actor: AuthUser) {
    const opportunityScopeFilter = await this.dataScopeService.buildScopedOpportunityFilter(actor, query.ownerId);
    const pagination = getPaginationParams(query);
    const sort = resolveSort(query, SALES_OPPORTUNITY_SORT_FIELDS, SALES_OPPORTUNITY_DEFAULT_SORT);
    const stageFilters = [buildExplicitStageFilter(query.stage), buildResultStatusFilter(query.resultStatus)].filter(
      (item) => Object.keys(item).length > 0
    );
    const where: Prisma.OpportunityWhereInput = {
      ...opportunityScopeFilter,
      customerId: query.customerId,
      sourceLeadId: query.sourceLeadId,
      AND: stageFilters.length ? stageFilters : undefined,
      OR: query.keyword
        ? [
            { name: { contains: query.keyword, mode: "insensitive" } },
            {
              customer: {
                name: {
                  contains: query.keyword,
                  mode: "insensitive"
                }
              }
            },
            {
              sourceLead: {
                name: {
                  contains: query.keyword,
                  mode: "insensitive"
                }
              }
            }
          ]
        : undefined,
      expectedCloseDate:
        query.expectedCloseDateStart || query.expectedCloseDateEnd
          ? {
              gte: query.expectedCloseDateStart ? new Date(query.expectedCloseDateStart) : undefined,
              lte: query.expectedCloseDateEnd ? new Date(query.expectedCloseDateEnd) : undefined
            }
          : undefined,
      closedAt:
        query.closedAtStart || query.closedAtEnd
          ? {
              gte: query.closedAtStart ? new Date(query.closedAtStart) : undefined,
              lte: query.closedAtEnd ? new Date(query.closedAtEnd) : undefined
            }
          : undefined
    };
    const orderBy: Prisma.OpportunityOrderByWithRelationInput[] = [
      { [sort.field]: sort.order } as Prisma.OpportunityOrderByWithRelationInput,
      { id: "desc" }
    ];
    const { items, total } = await this.salesOpportunitiesRepository.list(requireTenantId(actor), where, orderBy, pagination);
    const response = mapPaginatedSalesOpportunities(items, total, pagination, sort);

    response.items = response.items.map((item) =>
      this.accessPolicyService.sanitizeReadFields(actor, "opportunity", item)
    );
    return response;
  }

  async detail(id: string, actor: AuthUser) {
    await this.assertOpportunityAccessible(id, actor);
    const opportunity = await this.salesOpportunitiesRepository.findDetailById(id, requireTenantId(actor));

    return this.accessPolicyService.sanitizeReadFields(actor, "opportunity", mapSalesOpportunity(opportunity));
  }

  async create(dto: CreateSalesOpportunityDto, actor: AuthUser) {
    this.accessPolicyService.assertWritableFields(actor, "opportunity", dto as unknown as Record<string, unknown>);
    const stage = dto.stage ?? OpportunityStage.DISCOVERY;

    this.assertOpenStage(stage);

    await this.dataScopeService.assertCustomerAccessible(actor, dto.customerId, "You do not have access to the linked customer.");

    if (dto.sourceLeadId) {
      const sourceLead = await this.salesOpportunitiesRepository.findLeadScopeById(dto.sourceLeadId, requireTenantId(actor));

      await this.dataScopeService.assertOwnerAccessible(
        actor,
        sourceLead.ownerId,
        "You cannot link a lead outside your data scope."
      );
    }

    if (dto.ownerId) {
      await this.dataScopeService.assertOwnerAccessible(
        actor,
        dto.ownerId,
        "You cannot assign opportunities outside your data scope."
      );
    }

    const opportunity = await this.salesOpportunitiesRepository.createOpportunity({
      tenantId: requireTenantId(actor),
      name: dto.name,
      customerId: dto.customerId,
      sourceLeadId: dto.sourceLeadId,
      ownerId: dto.ownerId ?? actor.id,
      stage,
      expectedAmount: new Prisma.Decimal(dto.expectedAmount),
      expectedCloseDate: new Date(dto.expectedCloseDate),
      nextAction: dto.nextAction,
      notes: dto.notes,
      createdById: actor.id
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "sales-opportunity",
      targetId: opportunity.id
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "opportunity", mapSalesOpportunity(opportunity));
  }

  async update(id: string, dto: UpdateSalesOpportunityDto, actor: AuthUser) {
    const existing = await this.salesOpportunitiesRepository.findSnapshotById(id, requireTenantId(actor));

    await this.assertOpportunityAccessible(id, actor);
    await this.dataScopeService.assertCustomerAccessible(actor, existing.customerId, "You do not have access to the linked customer.");
    this.accessPolicyService.assertWritableFields(actor, "opportunity", dto as unknown as Record<string, unknown>);

    if (dto.ownerId) {
      await this.dataScopeService.assertOwnerAccessible(
        actor,
        dto.ownerId,
        "You cannot assign opportunities outside your data scope."
      );
    }

    if (dto.sourceLeadId) {
      const sourceLead = await this.salesOpportunitiesRepository.findLeadScopeById(dto.sourceLeadId, requireTenantId(actor));

      await this.dataScopeService.assertOwnerAccessible(
        actor,
        sourceLead.ownerId,
        "You cannot link a lead outside your data scope."
      );
    }

    const opportunity = await this.salesOpportunitiesRepository.updateOpportunity(id, requireTenantId(actor), {
      name: dto.name,
      sourceLeadId: dto.sourceLeadId,
      ownerId: dto.ownerId,
      expectedAmount: dto.expectedAmount === undefined ? undefined : new Prisma.Decimal(dto.expectedAmount),
      expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
      nextAction: dto.nextAction,
      notes: dto.notes
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "sales-opportunity",
      targetId: opportunity.id
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "opportunity", mapSalesOpportunity(opportunity));
  }

  async reassignOwner(id: string, dto: ReassignSalesOpportunityOwnerDto, actor: AuthUser) {
    const existing = await this.salesOpportunitiesRepository.findSnapshotById(id, requireTenantId(actor));

    await this.assertOpportunityAccessible(id, actor);
    await this.dataScopeService.assertOwnerAccessible(
      actor,
      dto.ownerId,
      "You cannot assign opportunities outside your data scope."
    );

    const opportunity = await this.salesOpportunitiesRepository.updateOwner(id, requireTenantId(actor), dto.ownerId);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.ASSIGN,
      targetType: "sales-opportunity",
      targetId: opportunity.id,
      detail: {
        fromOwnerId: existing.ownerId,
        toOwnerId: dto.ownerId
      }
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "opportunity", mapSalesOpportunity(opportunity));
  }

  async updateStage(id: string, dto: UpdateSalesOpportunityStageDto, actor: AuthUser) {
    const existing = await this.salesOpportunitiesRepository.findSnapshotById(id, requireTenantId(actor));

    await this.assertOpportunityAccessible(id, actor);
    this.assertOpportunityStillOpen(existing.stage);
    this.assertOpenStage(dto.stage);

    if (dto.stage === existing.stage) {
      throw new BadRequestException("The opportunity is already in this stage.");
    }

    const opportunity = await this.salesOpportunitiesRepository.changeStage({
      tenantId: requireTenantId(actor),
      id,
      fromStage: existing.stage,
      toStage: dto.stage,
      comment: dto.comment,
      createdById: actor.id
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "sales-opportunity-stage",
      targetId: id,
      detail: {
        fromStage: existing.stage,
        toStage: dto.stage
      }
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "opportunity", mapSalesOpportunity(opportunity));
  }

  async markWon(id: string, dto: MarkSalesOpportunityWonDto, actor: AuthUser) {
    const existing = await this.salesOpportunitiesRepository.findSnapshotById(id, requireTenantId(actor));

    await this.assertOpportunityAccessible(id, actor);
    this.assertOpportunityStillOpen(existing.stage);

    const opportunity = await this.salesOpportunitiesRepository.changeStage({
      tenantId: requireTenantId(actor),
      id,
      fromStage: existing.stage,
      toStage: OpportunityStage.CLOSED_WON,
      comment: dto.comment,
      closedAt: new Date(),
      lostReason: null,
      createdById: actor.id
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "sales-opportunity",
      targetId: id,
      detail: {
        fromStage: existing.stage,
        toStage: OpportunityStage.CLOSED_WON
      }
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "opportunity", mapSalesOpportunity(opportunity));
  }

  async markLost(id: string, dto: MarkSalesOpportunityLostDto, actor: AuthUser) {
    const existing = await this.salesOpportunitiesRepository.findSnapshotById(id, requireTenantId(actor));

    await this.assertOpportunityAccessible(id, actor);
    this.assertOpportunityStillOpen(existing.stage);

    const opportunity = await this.salesOpportunitiesRepository.changeStage({
      tenantId: requireTenantId(actor),
      id,
      fromStage: existing.stage,
      toStage: OpportunityStage.CLOSED_LOST,
      comment: dto.comment,
      closedAt: new Date(),
      lostReason: dto.lostReason,
      createdById: actor.id
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "sales-opportunity",
      targetId: id,
      detail: {
        fromStage: existing.stage,
        toStage: OpportunityStage.CLOSED_LOST,
        lostReason: dto.lostReason
      }
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "opportunity", mapSalesOpportunity(opportunity));
  }

  private async assertOpportunityAccessible(opportunityId: string, actor: AuthUser) {
    await this.dataScopeService.assertOpportunityAccessible(
      actor,
      opportunityId,
      "You do not have access to this opportunity."
    );
  }

  private assertOpportunityStillOpen(stage: OpportunityStage) {
    if (OPPORTUNITY_CLOSED_STAGES.includes(stage)) {
      throw new BadRequestException("Closed opportunities can no longer be updated through stage actions.");
    }
  }

  private assertOpenStage(stage: OpportunityStage) {
    if (!OPPORTUNITY_OPEN_STAGES.includes(stage)) {
      throw new BadRequestException("This action only supports in-progress stages.");
    }
  }
}

function buildExplicitStageFilter(stage?: OpportunityStage): Prisma.OpportunityWhereInput {
  if (!stage) {
    return {};
  }

  return {
    stage
  };
}

function buildResultStatusFilter(resultStatus?: OpportunityResultStatus): Prisma.OpportunityWhereInput {
  if (!resultStatus) {
    return {};
  }

  if (resultStatus === OpportunityResultStatus.WON) {
    return {
      stage: OpportunityStage.CLOSED_WON
    };
  }

  if (resultStatus === OpportunityResultStatus.LOST) {
    return {
      stage: OpportunityStage.CLOSED_LOST
    };
  }

  return {
    stage: {
      in: [...OPPORTUNITY_OPEN_STAGES]
    }
  };
}
