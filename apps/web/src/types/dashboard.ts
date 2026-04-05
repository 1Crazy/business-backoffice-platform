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
