/** dashboard 模块 mapper：负责把持久化结果转换为对外契约或上层可消费的数据结构。 */
export function mapDashboardOverview(input: {
  startDate: Date;
  endDate: Date;
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
}) {
  const closedOpportunityCount = input.wonOpportunities + input.lostOpportunities;

  return {
    startDate: input.startDate.toISOString(),
    endDate: input.endDate.toISOString(),
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
      closedOpportunityCount === 0 ? 0 : Number(((input.wonOpportunities / closedOpportunityCount) * 100).toFixed(2))
  };
}
