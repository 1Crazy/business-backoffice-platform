import { http } from "@/api/http";
import type { DashboardOverview, DashboardOverviewQuery } from "@/types/dashboard";

export async function fetchDashboardOverview(query: DashboardOverviewQuery): Promise<DashboardOverview> {
  const { data } = await http.get<DashboardOverview>("/dashboard/overview", {
    params: query
  });
  return data;
}
