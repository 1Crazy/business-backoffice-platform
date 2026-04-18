/** 行政申请记录 API：负责封装管理员检索与详情查询所需的后端接口。 */
import { http } from "@/api/http";
import type {
  AdministrativeRequestDetail,
  AdministrativeRequestItem,
  ListAdministrativeRequestQuery
} from "@/types/office-automation";

function normalizeAdministrativeRequestQuery(query?: ListAdministrativeRequestQuery) {
  if (!query) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

export async function fetchAdministrativeRequestRecords(
  query?: ListAdministrativeRequestQuery
): Promise<AdministrativeRequestItem[]> {
  const { data } = await http.get<AdministrativeRequestItem[]>("/oa/administrative-requests", {
    params: normalizeAdministrativeRequestQuery(query)
  });

  return data;
}

export async function fetchAdministrativeRequestRecordDetail(
  requestId: string
): Promise<AdministrativeRequestDetail> {
  const { data } = await http.get<AdministrativeRequestDetail>(`/oa/administrative-requests/${requestId}`);
  return data;
}
