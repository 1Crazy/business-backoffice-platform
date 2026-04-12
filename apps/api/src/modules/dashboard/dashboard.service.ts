/** dashboard 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { Injectable } from "@nestjs/common";
import { OpportunityStage, PaymentPlanStatus } from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { DataScopeService } from "@/common/data-scope/data-scope.service";
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
    const scope = await this.dataScopeService.resolveDataScope(actor);
    const scopeOptions = await this.dashboardRepository.listScopeOptions({
      isGlobal: scope.isGlobal,
      departmentIds: scope.departmentIds,
      ownerIds: scope.ownerIds
    });
    const selectedDepartmentId = scopeOptions.departments.some((item) => item.id === query.departmentId)
      ? query.departmentId
      : undefined;
    const ownersInScope = selectedDepartmentId
      ? scopeOptions.owners.filter((item) => item.departmentId === selectedDepartmentId)
      : scopeOptions.owners;
    const selectedOwnerId = ownersInScope.some((item) => item.id === query.ownerId) ? query.ownerId : undefined;
    const effectiveOwnerIds = selectedOwnerId ? [selectedOwnerId] : ownersInScope.map((item) => item.id);
    const [counts, funnelBreakdown, ownerPerformance, paymentPlans, approvalTimeliness] = await Promise.all([
      this.dashboardRepository.getOverviewCounts({
        ownerIds: effectiveOwnerIds,
        startDate,
        endDate
      }),
      this.dashboardRepository.getFunnelBreakdown({
        ownerIds: effectiveOwnerIds,
        startDate,
        endDate
      }),
      this.dashboardRepository.getOwnerPerformanceSnapshot({
        ownerIds: effectiveOwnerIds,
        startDate,
        endDate
      }),
      this.dashboardRepository.findPaymentPlansForForecast({
        ownerIds: effectiveOwnerIds,
        startDate,
        endDate
      }),
      this.dashboardRepository.getApprovalTimeliness({
        ownerIds: effectiveOwnerIds,
        startDate,
        endDate,
        staleBefore: new Date(Date.now() - 1000 * 60 * 60 * 48)
      })
    ]);

    return mapDashboardOverview({
      startDate,
      endDate,
      departmentId: selectedDepartmentId,
      ownerId: selectedOwnerId,
      departments: scopeOptions.departments,
      owners: ownersInScope,
      ...counts,
      salesFunnel: this.buildSalesFunnel(funnelBreakdown),
      ownerPerformanceRanking: this.buildOwnerRanking(ownerPerformance, scopeOptions.owners),
      departmentPerformanceRanking: this.buildDepartmentRanking(ownerPerformance, scopeOptions.owners),
      receivableForecast: this.buildReceivableForecast(paymentPlans),
      approvalTimeliness: this.buildApprovalTimeliness(approvalTimeliness)
    });
  }

  private buildSalesFunnel(input: Awaited<ReturnType<DashboardRepository["getFunnelBreakdown"]>>) {
    const stageMap = new Map(input.stages.map((item) => [item.stage, item]));
    const stageDefinitions: Array<{
      key: string;
      label: string;
      count: number;
      amount: number;
    }> = [
      {
        key: "LEADS",
        label: "线索池",
        count: input.totalLeads,
        amount: 0
      },
      {
        key: "CONVERTED_LEADS",
        label: "已转客户",
        count: input.convertedLeads,
        amount: 0
      },
      {
        key: OpportunityStage.DISCOVERY,
        label: "需求发现",
        count: stageMap.get(OpportunityStage.DISCOVERY)?.count ?? 0,
        amount: stageMap.get(OpportunityStage.DISCOVERY)?.amount ?? 0
      },
      {
        key: OpportunityStage.QUALIFICATION,
        label: "机会确认",
        count: stageMap.get(OpportunityStage.QUALIFICATION)?.count ?? 0,
        amount: stageMap.get(OpportunityStage.QUALIFICATION)?.amount ?? 0
      },
      {
        key: OpportunityStage.PROPOSAL,
        label: "方案提报",
        count: stageMap.get(OpportunityStage.PROPOSAL)?.count ?? 0,
        amount: stageMap.get(OpportunityStage.PROPOSAL)?.amount ?? 0
      },
      {
        key: OpportunityStage.NEGOTIATION,
        label: "商务谈判",
        count: stageMap.get(OpportunityStage.NEGOTIATION)?.count ?? 0,
        amount: stageMap.get(OpportunityStage.NEGOTIATION)?.amount ?? 0
      },
      {
        key: OpportunityStage.CLOSED_WON,
        label: "赢单",
        count: stageMap.get(OpportunityStage.CLOSED_WON)?.count ?? 0,
        amount: stageMap.get(OpportunityStage.CLOSED_WON)?.amount ?? 0
      }
    ];

    return stageDefinitions;
  }

  private buildOwnerRanking(
    snapshot: Awaited<ReturnType<DashboardRepository["getOwnerPerformanceSnapshot"]>>,
    owners: Awaited<ReturnType<DashboardRepository["listScopeOptions"]>>["owners"]
  ) {
    const ownerMap = new Map(owners.map((item) => [item.id, item]));

    return snapshot
      .map((item) => ({
        id: item.ownerId,
        label: ownerMap.get(item.ownerId)?.displayName ?? "未命名负责人",
        departmentName: ownerMap.get(item.ownerId)?.departmentName ?? null,
        wonAmount: item.wonAmount,
        receivedAmount: item.receivedAmount,
        newCustomers: item.newCustomers,
        wonOpportunities: item.wonOpportunities
      }))
      .sort(this.sortRanking)
      .slice(0, 5);
  }

  private buildDepartmentRanking(
    snapshot: Awaited<ReturnType<DashboardRepository["getOwnerPerformanceSnapshot"]>>,
    owners: Awaited<ReturnType<DashboardRepository["listScopeOptions"]>>["owners"]
  ) {
    const ownerMap = new Map(owners.map((item) => [item.id, item]));
    const ranking = new Map<
      string,
      {
        id: string;
        label: string;
        departmentName: string | null;
        wonAmount: number;
        receivedAmount: number;
        newCustomers: number;
        wonOpportunities: number;
      }
    >();

    for (const item of snapshot) {
      const owner = ownerMap.get(item.ownerId);
      const departmentId = owner?.departmentId ?? "unassigned";
      const departmentName = owner?.departmentName ?? "未分配部门";
      const current =
        ranking.get(departmentId) ??
        ({
          id: departmentId,
          label: departmentName,
          departmentName,
          wonAmount: 0,
          receivedAmount: 0,
          newCustomers: 0,
          wonOpportunities: 0
        } satisfies {
          id: string;
          label: string;
          departmentName: string | null;
          wonAmount: number;
          receivedAmount: number;
          newCustomers: number;
          wonOpportunities: number;
        });
      current.wonAmount += item.wonAmount;
      current.receivedAmount += item.receivedAmount;
      current.newCustomers += item.newCustomers;
      current.wonOpportunities += item.wonOpportunities;
      ranking.set(departmentId, current);
    }

    return Array.from(ranking.values()).sort(this.sortRanking).slice(0, 5);
  }

  private buildReceivableForecast(records: Awaited<ReturnType<DashboardRepository["findPaymentPlansForForecast"]>>) {
    const now = new Date();

    return records.reduce(
      (result, item) => {
        const outstandingAmount = Math.max(item.plannedAmount - item.receivedAmount, 0);

        result.plannedAmount += item.plannedAmount;
        result.receivedAmount += item.receivedAmount;
        result.unreceivedAmount += outstandingAmount;

        if (
          item.plannedDate.getTime() < now.getTime() &&
          item.status !== PaymentPlanStatus.PAID &&
          item.status !== PaymentPlanStatus.CANCELLED
        ) {
          result.overdueAmount += outstandingAmount;
        }

        return result;
      },
      {
        plannedAmount: 0,
        receivedAmount: 0,
        unreceivedAmount: 0,
        overdueAmount: 0
      }
    );
  }

  private buildApprovalTimeliness(input: Awaited<ReturnType<DashboardRepository["getApprovalTimeliness"]>>) {
    const leaveAverageHours = this.averageHours(
      input.completedLeaveRequests.map((item) => item.updatedAt.getTime() - item.createdAt.getTime())
    );
    const administrativeAverageHours = this.averageHours(
      input.completedAdministrativeRequests.map((item) =>
        (item.decidedAt ?? item.updatedAt).getTime() - item.submittedAt.getTime()
      )
    );
    const completedCount = input.completedLeaveRequests.length + input.completedAdministrativeRequests.length;
    const averageHours = this.averageHours([
      ...input.completedLeaveRequests.map((item) => item.updatedAt.getTime() - item.createdAt.getTime()),
      ...input.completedAdministrativeRequests.map((item) =>
        (item.decidedAt ?? item.updatedAt).getTime() - item.submittedAt.getTime()
      )
    ]);

    return {
      averageHours,
      leaveAverageHours,
      administrativeAverageHours,
      completedCount,
      pendingOver48Hours: input.pendingOver48Hours
    };
  }

  private averageHours(values: number[]) {
    if (values.length === 0) {
      return 0;
    }

    return Number((values.reduce((sum, current) => sum + current, 0) / values.length / (1000 * 60 * 60)).toFixed(2));
  }

  private sortRanking(
    left: {
      wonAmount: number;
      receivedAmount: number;
      wonOpportunities: number;
    },
    right: {
      wonAmount: number;
      receivedAmount: number;
      wonOpportunities: number;
    }
  ) {
    if (left.wonAmount !== right.wonAmount) {
      return right.wonAmount - left.wonAmount;
    }

    if (left.receivedAmount !== right.receivedAmount) {
      return right.receivedAmount - left.receivedAmount;
    }

    return right.wonOpportunities - left.wonOpportunities;
  }
}
