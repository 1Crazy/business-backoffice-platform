/** sales-opportunities 模块 repository：负责商机领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { OpportunityStage, Prisma } from "@prisma/client";

import type { PaginationParams } from "@/common/pagination/pagination.util";
import { PrismaService } from "@/common/prisma/prisma.service";

const opportunityListInclude = Prisma.validator<Prisma.OpportunityInclude>()({
  owner: true,
  customer: true,
  sourceLead: true
});

const stageHistoryInclude = Prisma.validator<Prisma.OpportunityStageHistoryInclude>()({
  createdBy: true
});

const opportunityDetailInclude = Prisma.validator<Prisma.OpportunityInclude>()({
  ...opportunityListInclude,
  stageHistory: {
    include: stageHistoryInclude,
    orderBy: {
      createdAt: "asc"
    }
  }
});

export type OpportunityListRecord = Prisma.OpportunityGetPayload<{
  include: typeof opportunityListInclude;
}>;

export type OpportunityDetailRecord = Prisma.OpportunityGetPayload<{
  include: typeof opportunityDetailInclude;
}>;

export type OpportunityStageHistoryRecord = Prisma.OpportunityStageHistoryGetPayload<{
  include: typeof stageHistoryInclude;
}>;

export type OpportunitySnapshotRecord = Prisma.OpportunityGetPayload<{
  select: {
    id: true;
    ownerId: true;
    customerId: true;
    sourceLeadId: true;
    stage: true;
    expectedAmount: true;
    expectedCloseDate: true;
    closedAt: true;
    lostReason: true;
  };
}>;

type OpportunityCustomerScopeRecord = Prisma.CustomerGetPayload<{
  select: {
    id: true;
    ownerId: true;
    name: true;
  };
}>;

type OpportunityLeadScopeRecord = Prisma.LeadGetPayload<{
  select: {
    id: true;
    ownerId: true;
    name: true;
  };
}>;

@Injectable()
export class SalesOpportunitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    where: Prisma.OpportunityWhereInput,
    orderBy: Prisma.OpportunityOrderByWithRelationInput[],
    pagination: PaginationParams
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.opportunity.findMany({
        where,
        include: opportunityListInclude,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.opportunity.count({ where })
    ]);

    return {
      items,
      total
    };
  }

  findDetailById(id: string) {
    return this.prisma.opportunity.findUniqueOrThrow({
      where: { id },
      include: opportunityDetailInclude
    });
  }

  findSnapshotById(id: string): Promise<OpportunitySnapshotRecord> {
    return this.prisma.opportunity.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        customerId: true,
        sourceLeadId: true,
        stage: true,
        expectedAmount: true,
        expectedCloseDate: true,
        closedAt: true,
        lostReason: true
      }
    });
  }

  findCustomerScopeById(id: string): Promise<OpportunityCustomerScopeRecord> {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        name: true
      }
    });
  }

  findLeadScopeById(id: string): Promise<OpportunityLeadScopeRecord> {
    return this.prisma.lead.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        name: true
      }
    });
  }

  createOpportunity(input: {
    name: string;
    customerId: string;
    sourceLeadId?: string | null;
    ownerId: string;
    stage: OpportunityStage;
    expectedAmount: Prisma.Decimal;
    expectedCloseDate: Date;
    nextAction: string;
    notes?: string | null;
    createdById: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.create({
        data: {
          name: input.name,
          customerId: input.customerId,
          sourceLeadId: input.sourceLeadId ?? undefined,
          ownerId: input.ownerId,
          stage: input.stage,
          expectedAmount: input.expectedAmount,
          expectedCloseDate: input.expectedCloseDate,
          nextAction: input.nextAction,
          notes: input.notes ?? undefined
        }
      });

      await tx.opportunityStageHistory.create({
        data: {
          opportunityId: opportunity.id,
          fromStage: null,
          toStage: input.stage,
          comment: "商机创建",
          createdById: input.createdById
        }
      });

      return tx.opportunity.findUniqueOrThrow({
        where: { id: opportunity.id },
        include: opportunityDetailInclude
      });
    });
  }

  async updateOpportunity(
    id: string,
    input: {
      name?: string;
      sourceLeadId?: string | null;
      ownerId?: string;
      expectedAmount?: Prisma.Decimal;
      expectedCloseDate?: Date;
      nextAction?: string;
      notes?: string | null;
    }
  ) {
    await this.prisma.opportunity.update({
      where: { id },
      data: {
        name: input.name,
        sourceLeadId: input.sourceLeadId,
        ownerId: input.ownerId,
        expectedAmount: input.expectedAmount,
        expectedCloseDate: input.expectedCloseDate,
        nextAction: input.nextAction,
        notes: input.notes
      }
    });

    return this.findDetailById(id);
  }

  async updateOwner(id: string, ownerId: string) {
    await this.prisma.opportunity.update({
      where: { id },
      data: {
        ownerId
      }
    });

    return this.findDetailById(id);
  }

  changeStage(input: {
    id: string;
    fromStage: OpportunityStage;
    toStage: OpportunityStage;
    comment?: string | null;
    closedAt?: Date | null;
    lostReason?: string | null;
    createdById: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.opportunity.update({
        where: { id: input.id },
        data: {
          stage: input.toStage,
          closedAt: input.closedAt ?? null,
          lostReason: input.lostReason ?? null
        }
      });

      await tx.opportunityStageHistory.create({
        data: {
          opportunityId: input.id,
          fromStage: input.fromStage,
          toStage: input.toStage,
          comment: input.comment ?? undefined,
          createdById: input.createdById
        }
      });

      return tx.opportunity.findUniqueOrThrow({
        where: { id: input.id },
        include: opportunityDetailInclude
      });
    });
  }
}
