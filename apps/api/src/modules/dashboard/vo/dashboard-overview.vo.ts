/** dashboard 模块 VO：负责 Swagger 与接口返回契约，避免直接暴露持久化结构。 */
import { ApiProperty } from "@nestjs/swagger";

class DashboardDepartmentFilterVo {
  @ApiProperty({
    description: "部门 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "部门名称。"
  })
  name!: string;
}

class DashboardOwnerFilterVo {
  @ApiProperty({
    description: "负责人 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "负责人名称。"
  })
  displayName!: string;

  @ApiProperty({
    description: "所属部门 ID。",
    nullable: true
  })
  departmentId!: string | null;

  @ApiProperty({
    description: "所属部门名称。",
    nullable: true
  })
  departmentName!: string | null;
}

class DashboardFunnelItemVo {
  @ApiProperty({
    description: "漏斗阶段键。"
  })
  key!: string;

  @ApiProperty({
    description: "漏斗阶段名称。"
  })
  label!: string;

  @ApiProperty({
    description: "当前阶段数量。"
  })
  count!: number;

  @ApiProperty({
    description: "当前阶段金额。"
  })
  amount!: number;
}

class DashboardRankingItemVo {
  @ApiProperty({
    description: "排行对象 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "排行对象名称。"
  })
  label!: string;

  @ApiProperty({
    description: "所属团队名称。",
    nullable: true
  })
  departmentName!: string | null;

  @ApiProperty({
    description: "赢单金额。"
  })
  wonAmount!: number;

  @ApiProperty({
    description: "已回款金额。"
  })
  receivedAmount!: number;

  @ApiProperty({
    description: "新增客户数。"
  })
  newCustomers!: number;

  @ApiProperty({
    description: "赢单数。"
  })
  wonOpportunities!: number;
}

class DashboardReceivableForecastVo {
  @ApiProperty({
    description: "计划回款金额。"
  })
  plannedAmount!: number;

  @ApiProperty({
    description: "已回款金额。"
  })
  receivedAmount!: number;

  @ApiProperty({
    description: "未回款金额。"
  })
  unreceivedAmount!: number;

  @ApiProperty({
    description: "逾期未回款金额。"
  })
  overdueAmount!: number;
}

class DashboardApprovalTimelinessVo {
  @ApiProperty({
    description: "平均审批耗时（小时）。"
  })
  averageHours!: number;

  @ApiProperty({
    description: "请假审批平均耗时（小时）。"
  })
  leaveAverageHours!: number;

  @ApiProperty({
    description: "行政申请平均耗时（小时）。"
  })
  administrativeAverageHours!: number;

  @ApiProperty({
    description: "统计周期内已完成审批数。"
  })
  completedCount!: number;

  @ApiProperty({
    description: "超 48 小时未处理的审批数。"
  })
  pendingOver48Hours!: number;
}

export class DashboardOverviewVo {
  @ApiProperty({
    description: "startDate 字段。",
format: "date-time"
  })
  startDate!: string;

  @ApiProperty({
    description: "endDate 字段。",
format: "date-time"
  })
  endDate!: string;

  @ApiProperty({
    description: "当前筛选的部门 ID。",
    nullable: true
  })
  departmentId!: string | null;

  @ApiProperty({
    description: "当前筛选的负责人 ID。",
    nullable: true
  })
  ownerId!: string | null;

  @ApiProperty({
    description: "可选团队列表。",
    type: () => [DashboardDepartmentFilterVo]
  })
  departments!: DashboardDepartmentFilterVo[];

  @ApiProperty({
    description: "可选负责人列表。",
    type: () => [DashboardOwnerFilterVo]
  })
  owners!: DashboardOwnerFilterVo[];

  @ApiProperty({
    description: "newCustomers 字段。"
  })
  newCustomers!: number;

  @ApiProperty({
    description: "followUpCount 字段。"
  })
  followUpCount!: number;

  @ApiProperty({
    description: "convertedLeads 字段。"
  })
  convertedLeads!: number;

  @ApiProperty({
    description: "totalLeads 字段。"
  })
  totalLeads!: number;

  @ApiProperty({
    description: "conversionRate 字段。"
  })
  conversionRate!: number;

  @ApiProperty({
    description: "pendingReminders 字段。"
  })
  pendingReminders!: number;

  @ApiProperty({
    description: "newOpportunities 字段。"
  })
  newOpportunities!: number;

  @ApiProperty({
    description: "pipelineForecastAmount 字段。"
  })
  pipelineForecastAmount!: number;

  @ApiProperty({
    description: "wonOpportunities 字段。"
  })
  wonOpportunities!: number;

  @ApiProperty({
    description: "wonAmount 字段。"
  })
  wonAmount!: number;

  @ApiProperty({
    description: "opportunityWinRate 字段。"
  })
  opportunityWinRate!: number;

  @ApiProperty({
    description: "销售漏斗摘要。",
    type: () => [DashboardFunnelItemVo]
  })
  salesFunnel!: DashboardFunnelItemVo[];

  @ApiProperty({
    description: "负责人业绩排行。",
    type: () => [DashboardRankingItemVo]
  })
  ownerPerformanceRanking!: DashboardRankingItemVo[];

  @ApiProperty({
    description: "团队业绩排行。",
    type: () => [DashboardRankingItemVo]
  })
  departmentPerformanceRanking!: DashboardRankingItemVo[];

  @ApiProperty({
    description: "回款预测摘要。",
    type: () => DashboardReceivableForecastVo
  })
  receivableForecast!: DashboardReceivableForecastVo;

  @ApiProperty({
    description: "审批时效摘要。",
    type: () => DashboardApprovalTimelinessVo
  })
  approvalTimeliness!: DashboardApprovalTimelinessVo;
}
