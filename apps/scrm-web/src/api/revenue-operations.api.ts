/** 经营闭环 API：负责封装报价、合同、回款与续费的请求契约。 */
import { http } from "@/api/http";
import type {
  Contract,
  CreateContractPayload,
  CreatePaymentPlanPayload,
  CreatePaymentRecordPayload,
  CreateQuotePayload,
  CreateRenewalReminderPayload,
  CustomerRevenueOverview,
  OpportunityRevenueOverview,
  PaymentPlan,
  PaymentRecord,
  Quote,
  RenewalReminder
} from "@/types/revenue-operations";

export async function fetchOpportunityRevenueOverview(opportunityId: string): Promise<OpportunityRevenueOverview> {
  const { data } = await http.get<OpportunityRevenueOverview>(`/revenue-operations/opportunities/${opportunityId}`);
  return data;
}

export async function fetchCustomerRevenueOverview(customerId: string): Promise<CustomerRevenueOverview> {
  const { data } = await http.get<CustomerRevenueOverview>(`/revenue-operations/customers/${customerId}`);
  return data;
}

export async function createQuote(payload: CreateQuotePayload): Promise<Quote> {
  const { data } = await http.post<Quote>("/revenue-operations/quotes", payload);
  return data;
}

export async function createContract(payload: CreateContractPayload): Promise<Contract> {
  const { data } = await http.post<Contract>("/revenue-operations/contracts", payload);
  return data;
}

export async function createPaymentPlan(payload: CreatePaymentPlanPayload): Promise<PaymentPlan> {
  const { data } = await http.post<PaymentPlan>("/revenue-operations/payment-plans", payload);
  return data;
}

export async function createPaymentRecord(payload: CreatePaymentRecordPayload): Promise<PaymentRecord> {
  const { data } = await http.post<PaymentRecord>("/revenue-operations/payment-records", payload);
  return data;
}

export async function createRenewalReminder(payload: CreateRenewalReminderPayload): Promise<RenewalReminder> {
  const { data } = await http.post<RenewalReminder>("/revenue-operations/renewal-reminders", payload);
  return data;
}
