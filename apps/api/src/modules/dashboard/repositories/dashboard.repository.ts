/** dashboard 模块 repository：负责 dashboard 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import {
  AdministrativeRequestStatus,
  LeaveRequestStatus,
  LeadStatus,
  OpportunityStage,
  PaymentPlanStatus,
  RecordStatus,
  ReminderStatus,
  UserStatus,
  type Prisma
} from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

export type DashboardScopeDepartmentRecord = {
  id: string;
  name: string;
};

export type DashboardScopeOwnerRecord = {
  id: string;
  displayName: string;
  departmentId: string | null;
  departmentName: string | null;
};

export type DashboardStageBreakdownRecord = {
  stage: OpportunityStage;
  count: number;
  amount: number;
};

export type DashboardOwnerPerformanceRecord = {
  ownerId: string;
  wonAmount: number;
  receivedAmount: number;
  newCustomers: number;
  wonOpportunities: number;
};

export type DashboardPaymentPlanForecastRecord = {
  plannedAmount: number;
  receivedAmount: number;
  plannedDate: Date;
  status: PaymentPlanStatus;
};

export type DashboardApprovalTimelinessRecord = {
  completedLeaveRequests: Array<{
    createdAt: Date;
    updatedAt: Date;
  }>;
  completedAdministrativeRequests: Array<{
    submittedAt: Date;
    decidedAt: Date | null;
    updatedAt: Date;
  }>;
  pendingOver48Hours: number;
};

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listScopeOptions(input: {
    isGlobal: boolean;
    departmentIds: string[];
    ownerIds?: string[];
  }): Promise<{
    departments: DashboardScopeDepartmentRecord[];
    owners: DashboardScopeOwnerRecord[];
  }> {
    const departmentWhere = input.isGlobal
      ? {
          status: RecordStatus.ACTIVE
        }
      : {
          status: RecordStatus.ACTIVE,
          id: {
            in: input.departmentIds.length ? input.departmentIds : ["__no_match__"]
          }
        };
    const ownerWhere = input.isGlobal
      ? {
          status: UserStatus.ACTIVE
        }
      : {
          status: UserStatus.ACTIVE,
          id: {
            in: input.ownerIds?.length ? input.ownerIds : ["__no_match__"]
          }
        };
    const [departments, owners] = await Promise.all([
      this.prisma.department.findMany({
        where: departmentWhere,
        select: {
          id: true,
          name: true
        },
        orderBy: [
          {
            name: "asc"
          }
        ]
      }),
      this.prisma.user.findMany({
        where: ownerWhere,
        select: {
          id: true,
          displayName: true,
          departmentId: true,
          department: {
            select: {
              name: true
            }
          }
        },
        orderBy: [
          {
            displayName: "asc"
          }
        ]
      })
    ]);

    return {
      departments,
      owners: owners.map((item) => ({
        id: item.id,
        displayName: item.displayName,
        departmentId: item.departmentId,
        departmentName: item.department?.name ?? null
      }))
    };
  }

  async getOverviewCounts(input: {
    ownerIds?: string[];
    startDate: Date;
    endDate: Date;
  }) {
    const [newCustomers, followUpCount, convertedLeads, totalLeads, pendingReminders, newOpportunities, pipelineForecastAggregate, wonOpportunities, wonAmountAggregate, lostOpportunities] =
      await Promise.all([
      this.prisma.customer.count({
        where: {
          ...buildOwnerScope(input.ownerIds),
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.followUp.count({
        where: {
          ...buildFollowUpScope(input.ownerIds),
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.lead.count({
        where: {
          ...buildOwnerScope(input.ownerIds),
          status: LeadStatus.CONVERTED,
          updatedAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.lead.count({
        where: {
          ...buildOwnerScope(input.ownerIds),
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.reminder.count({
        where: {
          ...buildOwnerScope(input.ownerIds),
          status: ReminderStatus.PENDING
        }
      }),
      this.prisma.opportunity.count({
        where: {
          ...buildOwnerScope(input.ownerIds),
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
          ...buildOwnerScope(input.ownerIds),
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
          ...buildOwnerScope(input.ownerIds),
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
          ...buildOwnerScope(input.ownerIds),
          stage: OpportunityStage.CLOSED_WON,
          closedAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.opportunity.count({
        where: {
          ...buildOwnerScope(input.ownerIds),
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

  async getFunnelBreakdown(input: {
    ownerIds?: string[];
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalLeads: number;
    convertedLeads: number;
    stages: DashboardStageBreakdownRecord[];
  }> {
    const [totalLeads, convertedLeads, stageRows] = await Promise.all([
      this.prisma.lead.count({
        where: {
          ...buildOwnerScope(input.ownerIds),
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.lead.count({
        where: {
          ...buildOwnerScope(input.ownerIds),
          status: LeadStatus.CONVERTED,
          updatedAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.opportunity.groupBy({
        by: ["stage"],
        _count: {
          _all: true
        },
        _sum: {
          expectedAmount: true
        },
        where: {
          ...buildOwnerScope(input.ownerIds),
          OR: [
            {
              stage: {
                in: [
                  OpportunityStage.DISCOVERY,
                  OpportunityStage.QUALIFICATION,
                  OpportunityStage.PROPOSAL,
                  OpportunityStage.NEGOTIATION
                ]
              },
              createdAt: {
                gte: input.startDate,
                lte: input.endDate
              }
            },
            {
              stage: OpportunityStage.CLOSED_WON,
              closedAt: {
                gte: input.startDate,
                lte: input.endDate
              }
            }
          ]
        }
      })
    ]);

    return {
      totalLeads,
      convertedLeads,
      stages: stageRows.map((item) => ({
        stage: item.stage,
        count: item._count._all,
        amount: decimalToNumber(item._sum.expectedAmount)
      }))
    };
  }

  async getOwnerPerformanceSnapshot(input: {
    ownerIds?: string[];
    startDate: Date;
    endDate: Date;
  }): Promise<DashboardOwnerPerformanceRecord[]> {
    const [wonRows, paymentRows, customerRows] = await Promise.all([
      this.prisma.opportunity.groupBy({
        by: ["ownerId"],
        _count: {
          _all: true
        },
        _sum: {
          expectedAmount: true
        },
        where: {
          ...buildOwnerScope(input.ownerIds),
          stage: OpportunityStage.CLOSED_WON,
          closedAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.paymentRecord.groupBy({
        by: ["ownerId"],
        _sum: {
          amount: true
        },
        where: {
          ...buildOwnerScope(input.ownerIds),
          receivedAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      }),
      this.prisma.customer.groupBy({
        by: ["ownerId"],
        _count: {
          _all: true
        },
        where: {
          ...buildOwnerScope(input.ownerIds),
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      })
    ]);

    const snapshot = new Map<string, DashboardOwnerPerformanceRecord>();

    for (const item of wonRows) {
      snapshot.set(item.ownerId, {
        ownerId: item.ownerId,
        wonAmount: decimalToNumber(item._sum.expectedAmount),
        receivedAmount: 0,
        newCustomers: 0,
        wonOpportunities: item._count._all
      });
    }

    for (const item of paymentRows) {
      const current =
        snapshot.get(item.ownerId) ??
        ({
          ownerId: item.ownerId,
          wonAmount: 0,
          receivedAmount: 0,
          newCustomers: 0,
          wonOpportunities: 0
        } satisfies DashboardOwnerPerformanceRecord);
      current.receivedAmount = decimalToNumber(item._sum.amount);
      snapshot.set(item.ownerId, current);
    }

    for (const item of customerRows) {
      const current =
        snapshot.get(item.ownerId) ??
        ({
          ownerId: item.ownerId,
          wonAmount: 0,
          receivedAmount: 0,
          newCustomers: 0,
          wonOpportunities: 0
        } satisfies DashboardOwnerPerformanceRecord);
      current.newCustomers = item._count._all;
      snapshot.set(item.ownerId, current);
    }

    return Array.from(snapshot.values());
  }

  async findPaymentPlansForForecast(input: {
    ownerIds?: string[];
    startDate: Date;
    endDate: Date;
  }): Promise<DashboardPaymentPlanForecastRecord[]> {
    const rows = await this.prisma.paymentPlan.findMany({
      where: {
        ...buildOwnerScope(input.ownerIds),
        status: {
          not: PaymentPlanStatus.CANCELLED
        },
        plannedDate: {
          gte: input.startDate,
          lte: input.endDate
        }
      },
      select: {
        plannedAmount: true,
        receivedAmount: true,
        plannedDate: true,
        status: true
      }
    });

    return rows.map((item) => ({
      plannedAmount: decimalToNumber(item.plannedAmount),
      receivedAmount: decimalToNumber(item.receivedAmount),
      plannedDate: item.plannedDate,
      status: item.status
    }));
  }

  async getApprovalTimeliness(input: {
    ownerIds?: string[];
    startDate: Date;
    endDate: Date;
    staleBefore: Date;
  }): Promise<DashboardApprovalTimelinessRecord> {
    const [completedLeaveRequests, completedAdministrativeRequests, pendingLeaveRequests, pendingAdministrativeRequests] =
      await Promise.all([
        this.prisma.leaveRequest.findMany({
          where: {
            approverId: {
              in: input.ownerIds ?? []
            },
            status: {
              in: [LeaveRequestStatus.APPROVED, LeaveRequestStatus.REJECTED]
            },
            updatedAt: {
              gte: input.startDate,
              lte: input.endDate
            }
          },
          select: {
            createdAt: true,
            updatedAt: true
          }
        }),
        this.prisma.administrativeRequest.findMany({
          where: {
            approverId: {
              in: input.ownerIds ?? []
            },
            status: {
              in: [AdministrativeRequestStatus.APPROVED, AdministrativeRequestStatus.REJECTED]
            },
            updatedAt: {
              gte: input.startDate,
              lte: input.endDate
            }
          },
          select: {
            submittedAt: true,
            decidedAt: true,
            updatedAt: true
          }
        }),
        this.prisma.leaveRequest.count({
          where: {
            approverId: {
              in: input.ownerIds ?? []
            },
            status: LeaveRequestStatus.PENDING,
            createdAt: {
              lte: input.staleBefore
            }
          }
        }),
        this.prisma.administrativeRequest.count({
          where: {
            approverId: {
              in: input.ownerIds ?? []
            },
            status: AdministrativeRequestStatus.PENDING,
            submittedAt: {
              lte: input.staleBefore
            }
          }
        })
      ]);

    return {
      completedLeaveRequests,
      completedAdministrativeRequests,
      pendingOver48Hours: pendingLeaveRequests + pendingAdministrativeRequests
    };
  }
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) {
    return 0;
  }

  return Number(value.toString());
}

function buildOwnerScope(ownerIds?: string[]) {
  if (!ownerIds) {
    return {};
  }

  return {
    ownerId: {
      in: ownerIds
    }
  };
}

function buildFollowUpScope(ownerIds?: string[]): Prisma.FollowUpWhereInput {
  if (!ownerIds) {
    return {};
  }

  return {
    OR: [
      {
        lead: {
          ownerId: {
            in: ownerIds
          }
        }
      },
      {
        customer: {
          ownerId: {
            in: ownerIds
          }
        }
      }
    ]
  };
}
