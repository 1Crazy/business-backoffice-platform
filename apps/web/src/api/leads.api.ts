/** 领域 API：负责封装页面到后端的请求契约，避免页面直接依赖底层 HTTP 客户端。 */
import { http } from "@/api/http";
import type { User } from "@/types/access-control";
import type { DictionaryEntry } from "@/types/dictionaries";
import type { FollowUp, ReminderListItem } from "@/types/follow-ups";
import type {
  CreateLeadFollowUpPayload,
  CreateLeadPayload,
  Lead,
  LeadListQuery,
  TransferLeadOwnerPayload,
  UpdateLeadPayload
} from "@/types/leads";
import type { PaginatedResponse } from "@/types/pagination";

export async function fetchLeadMeta(): Promise<{
  users: User[];
  sourceOptions: DictionaryEntry[];
}> {
  const [userResponse, sourceResponse] = await Promise.all([
    http.get<User[]>("/users"),
    http.get<DictionaryEntry[]>("/dictionaries", {
      params: { type: "customer-source" }
    })
  ]);

  return {
    users: userResponse.data,
    sourceOptions: sourceResponse.data
  };
}

export async function fetchLeads(query: LeadListQuery): Promise<PaginatedResponse<Lead>> {
  const { data } = await http.get<PaginatedResponse<Lead>>("/leads", {
    params: query
  });
  return data;
}

export async function fetchLeadReminders(page: number, pageSize: number): Promise<PaginatedResponse<ReminderListItem>> {
  const { data } = await http.get<PaginatedResponse<ReminderListItem>>("/leads/reminders", {
    params: {
      page,
      pageSize
    }
  });
  return data;
}

export async function fetchLeadDetail(leadId: string): Promise<Lead> {
  const { data } = await http.get<Lead>(`/leads/${leadId}`);
  return data;
}

export async function fetchLeadFollowUps(leadId: string): Promise<FollowUp[]> {
  const { data } = await http.get<FollowUp[]>(`/leads/${leadId}/follow-ups`);
  return data;
}

export async function createLead(payload: CreateLeadPayload): Promise<void> {
  await http.post("/leads", payload);
}

export async function updateLead(leadId: string, payload: UpdateLeadPayload): Promise<void> {
  await http.patch(`/leads/${leadId}`, payload);
}

export async function transferLeadOwner(leadId: string, payload: TransferLeadOwnerPayload): Promise<void> {
  await http.patch(`/leads/${leadId}/owner`, payload);
}

export async function convertLeadToCustomer(leadId: string): Promise<void> {
  await http.post(`/leads/${leadId}/convert`);
}

export async function createLeadFollowUp(leadId: string, payload: CreateLeadFollowUpPayload): Promise<void> {
  await http.post(`/leads/${leadId}/follow-ups`, payload);
}
