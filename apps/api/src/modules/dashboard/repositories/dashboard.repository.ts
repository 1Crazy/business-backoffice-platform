/** dashboard 模块 repository：负责 dashboard 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { LeadStatus, OpportunityStage, type Prisma, ReminderStatus } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewCounts(input: {
    ownerFilter: { ownerId?: { in: string[] } };
    followUpScope: Prisma.FollowUpWhereInput;
    startDate: Date;
    endDate: Date;
  }) {
    const [newCustomers, followUpCount, convertedLeads, totalLeads, pendingReminders, newOpportunities, pipelineForecastAggregate, wonOpportunities, wonAmountAggregate, lostOpportunities] =
      await Promise.all([
      this.prisma.customer.count({
        where: {
          ...input.ownerFilter,
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.followUp.count({
        where: {
          ...input.followUpScope,
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.lead.count({
        where: {
          ...input.ownerFilter,
          status: LeadStatus.CONVERTED,
          updatedAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.lead.count({
        where: {
          ...input.ownerFilter,
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.reminder.count({
        where: {
          ...input.ownerFilter,
          status: ReminderStatus.PENDING
        }
      }),
      this.prisma.opportunity.count({
        where: {
          ...input.ownerFilter,
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.opportunity.aggregate({
        _sum: {
          expectedAmount: true
        },
        where: {
          ...input.ownerFilter,
          stage: {
            in: [
              OpportunityStage.DISCOVERY,
              OpportunityStage.QUALIFICATION,
              OpportunityStage.PROPOSAL,
              OpportunityStage.NEGOTIATION
            ]
          },
          expectedCloseDate: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.opportunity.count({
        where: {
          ...input.ownerFilter,
          stage: OpportunityStage.CLOSED_WON,
          closedAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.opportunity.aggregate({
        _sum: {
          expectedAmount: true
        },
        where: {
          ...input.ownerFilter,
          stage: OpportunityStage.CLOSED_WON,
          closedAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.opportunity.count({
        where: {
          ...input.ownerFilter,
          stage: OpportunityStage.CLOSED_LOST,
          closedAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      })
    ]);

    return {
      newCustomers,
      followUpCount,
      convertedLeads,
      totalLeads,
      pendingReminders,
      newOpportunities,
      pipelineForecastAmount: decimalToNumber(pipelineForecastAggregate._sum.expectedAmount),
      wonOpportunities,
      wonAmount: decimalToNumber(wonAmountAggregate._sum.expectedAmount),
      lostOpportunities
    };
  }
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) {
    return 0;
  }

  return Number(value.toString());
}
