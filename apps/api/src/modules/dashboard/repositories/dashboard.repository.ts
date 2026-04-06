/** dashboard 模块 repository：负责 dashboard 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { LeadStatus, type Prisma, ReminderStatus } from "@prisma/client";

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
    const [newCustomers, followUpCount, convertedLeads, totalLeads, pendingReminders] = await Promise.all([
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
      })
    ]);

    return {
      newCustomers,
      followUpCount,
      convertedLeads,
      totalLeads,
      pendingReminders
    };
  }
}
