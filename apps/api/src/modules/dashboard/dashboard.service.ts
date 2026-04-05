import { Injectable } from "@nestjs/common";
import { LeadStatus, type Prisma, ReminderStatus } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { DataScopeService } from "../../common/data-scope/data-scope.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService
  ) {}

  async overview(query: DashboardQueryDto, actor: AuthUser) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 1000 * 60 * 60 * 24 * 30);

    const ownerIds = await this.dataScopeService.resolveAccessibleOwnerIds(actor);
    const ownerFilter = this.buildOwnerScope(ownerIds);
    const followUpScope = this.buildFollowUpScope(ownerIds);

    const [newCustomers, followUpCount, convertedLeads, totalLeads, pendingReminders] = await Promise.all([
      this.prisma.customer.count({
        where: {
          ...ownerFilter,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      this.prisma.followUp.count({
        where: {
          ...followUpScope,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      this.prisma.lead.count({
        where: {
          ...ownerFilter,
          status: LeadStatus.CONVERTED,
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      this.prisma.lead.count({
        where: {
          ...ownerFilter,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      this.prisma.reminder.count({
        where: {
          ...ownerFilter,
          status: ReminderStatus.PENDING
        }
      })
    ]);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      newCustomers,
      followUpCount,
      convertedLeads,
      totalLeads,
      conversionRate: totalLeads === 0 ? 0 : Number(((convertedLeads / totalLeads) * 100).toFixed(2)),
      pendingReminders
    };
  }

  private buildOwnerScope(ownerIds?: string[]): { ownerId?: { in: string[] } } {
    if (!ownerIds) {
      return {};
    }

    return {
      ownerId: {
        in: ownerIds
      }
    };
  }

  private buildFollowUpScope(ownerIds?: string[]): Prisma.FollowUpWhereInput {
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
}
