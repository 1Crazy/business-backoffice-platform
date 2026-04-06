/** 领域 API：负责封装页面到后端的请求契约，避免页面直接依赖底层 HTTP 客户端。 */
import { http } from "@/api/http";
import type { DashboardOverview, DashboardOverviewQuery } from "@/types/dashboard";

export async function fetchDashboardOverview(query: DashboardOverviewQuery): Promise<DashboardOverview> {
  const { data } = await http.get<DashboardOverview>("/dashboard/overview", {
    params: query
  });
  return data;
}
