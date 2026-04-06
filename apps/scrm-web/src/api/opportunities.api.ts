/** 领域 API：负责封装页面到后端的请求契约，避免页面直接依赖底层 HTTP 客户端。 */
import { http } from "@/api/http";
import type { User } from "@/types/access-control";
import type { Customer } from "@/types/customers";
import type { Lead } from "@/types/leads";
import type {
  AdvanceOpportunityStagePayload,
  CreateOpportunityPayload,
  MarkOpportunityLostPayload,
  MarkOpportunityWonPayload,
  Opportunity,
  OpportunityListQuery,
  TransferOpportunityOwnerPayload,
  UpdateOpportunityPayload
} from "@/types/opportunities";
import type { PaginatedResponse } from "@/types/pagination";

export async function fetchOpportunityMeta(): Promise<{
  users: User[];
  customers: Array<{ id: string; name: string }>;
  leads: Array<{ id: string; name: string }>;
}> {
  const [userResponse, customerResponse, leadResponse] = await Promise.all([
    http.get<User[]>("/users"),
    http.get<PaginatedResponse<Customer>>("/customers", {
      params: {
        page: 1,
        pageSize: 100,
        sortBy: "updatedAt",
        sortOrder: "desc"
      }
    }),
    http.get<PaginatedResponse<Lead>>("/leads", {
      params: {
        page: 1,
        pageSize: 100,
        sortBy: "updatedAt",
        sortOrder: "desc"
      }
    })
  ]);

  return {
    users: userResponse.data,
    customers: customerResponse.data.items.map((item) => ({
      id: item.id,
      name: item.name
    })),
    leads: leadResponse.data.items.map((item) => ({
      id: item.id,
      name: item.name
    }))
  };
}

export async function fetchOpportunities(query: OpportunityListQuery): Promise<PaginatedResponse<Opportunity>> {
  const { data } = await http.get<PaginatedResponse<Opportunity>>("/sales-opportunities", {
    params: query
  });

  return data;
}

export async function fetchOpportunityDetail(opportunityId: string): Promise<Opportunity> {
  const { data } = await http.get<Opportunity>(`/sales-opportunities/${opportunityId}`);
  return data;
}

export async function createOpportunity(payload: CreateOpportunityPayload): Promise<void> {
  await http.post("/sales-opportunities", payload);
}

export async function updateOpportunity(opportunityId: string, payload: UpdateOpportunityPayload): Promise<void> {
  await http.patch(`/sales-opportunities/${opportunityId}`, payload);
}

export async function transferOpportunityOwner(
  opportunityId: string,
  payload: TransferOpportunityOwnerPayload
): Promise<void> {
  await http.patch(`/sales-opportunities/${opportunityId}/owner`, payload);
}

export async function advanceOpportunityStage(
  opportunityId: string,
  payload: AdvanceOpportunityStagePayload
): Promise<void> {
  await http.patch(`/sales-opportunities/${opportunityId}/stage`, payload);
}

export async function markOpportunityWon(
  opportunityId: string,
  payload: MarkOpportunityWonPayload
): Promise<void> {
  await http.patch(`/sales-opportunities/${opportunityId}/mark-won`, payload);
}

export async function markOpportunityLost(
  opportunityId: string,
  payload: MarkOpportunityLostPayload
): Promise<void> {
  await http.patch(`/sales-opportunities/${opportunityId}/mark-lost`, payload);
}
