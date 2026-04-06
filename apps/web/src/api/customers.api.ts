/** 领域 API：负责封装页面到后端的请求契约，避免页面直接依赖底层 HTTP 客户端。 */
import { http } from "@/api/http";
import type { User } from "@/types/access-control";
import type {
  CreateCustomerFollowUpPayload,
  CreateCustomerPayload,
  CreateCustomerTagPayload,
  Customer,
  CustomerListQuery,
  CustomerTag,
  TransferCustomerOwnerPayload,
  UpdateCustomerPayload
} from "@/types/customers";
import type { DictionaryEntry } from "@/types/dictionaries";
import type { FollowUp } from "@/types/follow-ups";
import type { PaginatedResponse } from "@/types/pagination";

export async function fetchCustomerMeta(): Promise<{
  users: User[];
  tags: CustomerTag[];
  sourceOptions: DictionaryEntry[];
  statusOptions: DictionaryEntry[];
}> {
  const [userResponse, tagResponse, sourceResponse, statusResponse] = await Promise.all([
    http.get<User[]>("/users"),
    http.get<CustomerTag[]>("/customers/tags"),
    http.get<DictionaryEntry[]>("/dictionaries", {
      params: { type: "customer-source" }
    }),
    http.get<DictionaryEntry[]>("/dictionaries", {
      params: { type: "customer-status" }
    })
  ]);

  return {
    users: userResponse.data,
    tags: tagResponse.data,
    sourceOptions: sourceResponse.data,
    statusOptions: statusResponse.data
  };
}

export async function fetchCustomers(query: CustomerListQuery): Promise<PaginatedResponse<Customer>> {
  const { data } = await http.get<PaginatedResponse<Customer>>("/customers", {
    params: query
  });
  return data;
}

export async function fetchCustomerDetail(customerId: string): Promise<Customer> {
  const { data } = await http.get<Customer>(`/customers/${customerId}`);
  return data;
}

export async function fetchCustomerFollowUps(customerId: string): Promise<FollowUp[]> {
  const { data } = await http.get<FollowUp[]>(`/customers/${customerId}/follow-ups`);
  return data;
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<void> {
  await http.post("/customers", payload);
}

export async function updateCustomer(customerId: string, payload: UpdateCustomerPayload): Promise<void> {
  await http.patch(`/customers/${customerId}`, payload);
}

export async function createCustomerTag(payload: CreateCustomerTagPayload): Promise<void> {
  await http.post("/customers/tags", payload);
}

export async function transferCustomerOwner(customerId: string, payload: TransferCustomerOwnerPayload): Promise<void> {
  await http.patch(`/customers/${customerId}/owner`, payload);
}

export async function createCustomerFollowUp(customerId: string, payload: CreateCustomerFollowUpPayload): Promise<void> {
  await http.post(`/customers/${customerId}/follow-ups`, payload);
}
