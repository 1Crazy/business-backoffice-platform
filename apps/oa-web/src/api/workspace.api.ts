/** OA 工作台 API：负责封装工作台摘要查询请求。 */
import { http } from "@/api/http";
import type { WorkspaceOverview } from "@/types/office-automation";

export async function fetchWorkspaceOverview(): Promise<WorkspaceOverview> {
  const { data } = await http.get<WorkspaceOverview>("/oa/workspace/overview");
  return data;
}
