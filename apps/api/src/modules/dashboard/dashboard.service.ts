import { Injectable } from "@nestjs/common";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { PrismaService } from "../../common/prisma/prisma.service";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(query: DashboardQueryDto, actor: AuthUser) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 1000 * 60 * 60 * 24 * 30);

    const ownerFilter = await this.buildOwnerScope(actor);

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
          createdById: ownerFilter.ownerId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      this.prisma.lead.count({
        where: {
          ...ownerFilter,
          status: "CONVERTED",
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
          ownerId: ownerFilter.ownerId
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

  private async buildOwnerScope(actor: AuthUser) {
    if (actor.roleCodes.includes("super-admin")) {
      return {};
    }

    if (actor.roleCodes.includes("sales-manager") && actor.departmentId) {
      const users = await this.prisma.user.findMany({
        where: {
          departmentId: actor.departmentId
        },
        select: {
          id: true
        }
      });

      return {
        ownerId: {
          in: users.map((item) => item.id)
        }
      };
    }

    return {
      ownerId: actor.id
    };
  }
}

