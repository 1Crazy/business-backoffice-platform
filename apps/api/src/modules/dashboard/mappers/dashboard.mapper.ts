/** dashboard 模块 mapper：负责把持久化结果转换为对外契约或上层可消费的数据结构。 */
export function mapDashboardOverview(input: {
  startDate: Date;
  endDate: Date;
  newCustomers: number;
  followUpCount: number;
  convertedLeads: number;
  totalLeads: number;
  pendingReminders: number;
}) {
  return {
    startDate: input.startDate.toISOString(),
    endDate: input.endDate.toISOString(),
    newCustomers: input.newCustomers,
    followUpCount: input.followUpCount,
    convertedLeads: input.convertedLeads,
    totalLeads: input.totalLeads,
    conversionRate: input.totalLeads === 0 ? 0 : Number(((input.convertedLeads / input.totalLeads) * 100).toFixed(2)),
    pendingReminders: input.pendingReminders
  };
}
