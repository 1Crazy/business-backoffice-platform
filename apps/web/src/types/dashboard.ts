/** 领域类型定义：负责维护当前子域的请求、响应和表单模型契约。 */
export interface DashboardOverview {
  startDate: string;
  endDate: string;
  newCustomers: number;
  followUpCount: number;
  convertedLeads: number;
  totalLeads: number;
  conversionRate: number;
  pendingReminders: number;
}

export type DashboardDateRange = [string, string] | [];

export interface DashboardOverviewQuery {
  startDate?: string;
  endDate?: string;
}
