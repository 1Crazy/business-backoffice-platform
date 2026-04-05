import { Injectable } from "@nestjs/common";
import { LeadStatus, type Prisma, ReminderStatus } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { DataScopeService } from "../../common/data-scope/data-scope.service";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { mapDashboardOverview } from "./mappers/dashboard.mapper";
import { DashboardRepository } from "./repositories/dashboard.repository";

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
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

    const counts = await this.dashboardRepository.getOverviewCounts({
      ownerFilter,
      followUpScope,
      startDate,
      endDate
    });

    return mapDashboardOverview({
      startDate,
      endDate,
      ...counts
    });
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
