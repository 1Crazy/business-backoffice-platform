/** 领域类型定义：负责维护当前子域的请求、响应和表单模型契约。 */
export interface DashboardDepartmentFilterOption {
  id: string;
  name: string;
}

export interface DashboardOwnerFilterOption {
  id: string;
  displayName: string;
  departmentId?: string | null;
  departmentName?: string | null;
}

export interface DashboardFunnelItem {
  key: string;
  label: string;
  count: number;
  amount: number;
}

export interface DashboardRankingItem {
  id: string;
  label: string;
  departmentName?: string | null;
  wonAmount: number;
  receivedAmount: number;
  newCustomers: number;
  wonOpportunities: number;
}

export interface DashboardReceivableForecast {
  plannedAmount: number;
  receivedAmount: number;
  unreceivedAmount: number;
  overdueAmount: number;
}

export interface DashboardApprovalTimeliness {
  averageHours: number;
  leaveAverageHours: number;
  administrativeAverageHours: number;
  completedCount: number;
  pendingOver48Hours: number;
}

export interface DashboardOverview {
  startDate: string;
  endDate: string;
  departmentId?: string | null;
  ownerId?: string | null;
  departments: DashboardDepartmentFilterOption[];
  owners: DashboardOwnerFilterOption[];
  newCustomers: number;
  followUpCount: number;
  convertedLeads: number;
  totalLeads: number;
  conversionRate: number;
  pendingReminders: number;
  newOpportunities: number;
  pipelineForecastAmount: number;
  wonOpportunities: number;
  wonAmount: number;
  opportunityWinRate: number;
  salesFunnel: DashboardFunnelItem[];
  ownerPerformanceRanking: DashboardRankingItem[];
  departmentPerformanceRanking: DashboardRankingItem[];
  receivableForecast: DashboardReceivableForecast;
  approvalTimeliness: DashboardApprovalTimeliness;
}

export type DashboardDateRange = [string, string] | [];

export interface DashboardOverviewQuery {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  ownerId?: string;
}
