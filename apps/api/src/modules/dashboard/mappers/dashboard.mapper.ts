/** dashboard 模块 mapper：负责把持久化结果转换为对外契约或上层可消费的数据结构。 */
export function mapDashboardOverview(input: {
  startDate: Date;
  endDate: Date;
  departmentId?: string;
  ownerId?: string;
  departments: Array<{
    id: string;
    name: string;
  }>;
  owners: Array<{
    id: string;
    displayName: string;
    departmentId?: string | null;
    departmentName?: string | null;
  }>;
  newCustomers: number;
  followUpCount: number;
  convertedLeads: number;
  totalLeads: number;
  pendingReminders: number;
  newOpportunities: number;
  pipelineForecastAmount: number;
  wonOpportunities: number;
  wonAmount: number;
  lostOpportunities: number;
  salesFunnel: Array<{
    key: string;
    label: string;
    count: number;
    amount: number;
  }>;
  ownerPerformanceRanking: Array<{
    id: string;
    label: string;
    departmentName?: string | null;
    wonAmount: number;
    receivedAmount: number;
    newCustomers: number;
    wonOpportunities: number;
  }>;
  departmentPerformanceRanking: Array<{
    id: string;
    label: string;
    departmentName?: string | null;
    wonAmount: number;
    receivedAmount: number;
    newCustomers: number;
    wonOpportunities: number;
  }>;
  receivableForecast: {
    plannedAmount: number;
    receivedAmount: number;
    unreceivedAmount: number;
    overdueAmount: number;
  };
  approvalTimeliness: {
    averageHours: number;
    leaveAverageHours: number;
    administrativeAverageHours: number;
    completedCount: number;
    pendingOver48Hours: number;
  };
}) {
  const closedOpportunityCount = input.wonOpportunities + input.lostOpportunities;

  return {
    startDate: input.startDate.toISOString(),
    endDate: input.endDate.toISOString(),
    departmentId: input.departmentId ?? null,
    ownerId: input.ownerId ?? null,
    departments: input.departments,
    owners: input.owners,
    newCustomers: input.newCustomers,
    followUpCount: input.followUpCount,
    convertedLeads: input.convertedLeads,
    totalLeads: input.totalLeads,
    conversionRate: input.totalLeads === 0 ? 0 : Number(((input.convertedLeads / input.totalLeads) * 100).toFixed(2)),
    pendingReminders: input.pendingReminders,
    newOpportunities: input.newOpportunities,
    pipelineForecastAmount: input.pipelineForecastAmount,
    wonOpportunities: input.wonOpportunities,
    wonAmount: input.wonAmount,
    opportunityWinRate:
      closedOpportunityCount === 0 ? 0 : Number(((input.wonOpportunities / closedOpportunityCount) * 100).toFixed(2)),
    salesFunnel: input.salesFunnel,
    ownerPerformanceRanking: input.ownerPerformanceRanking,
    departmentPerformanceRanking: input.departmentPerformanceRanking,
    receivableForecast: input.receivableForecast,
    approvalTimeliness: input.approvalTimeliness
  };
}
