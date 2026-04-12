/** 经营闭环类型：负责维护报价、合同、回款与续费相关的前端契约。 */
export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type ContractStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
export type PaymentPlanStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
export type RenewalReminderStatus = "PENDING" | "CONTACTED" | "COMPLETED" | "DISMISSED";
export type RevenueOperationDetailType = "quote" | "contract" | "paymentPlan" | "paymentRecord" | "renewalReminder";

export interface Quote {
  id: string;
  quoteNo: string;
  title: string;
  amount: number;
  status: QuoteStatus;
  issuedAt?: string | null;
  expiresAt?: string | null;
  notes?: string | null;
  customerId: string;
  opportunityId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  contractNo: string;
  title: string;
  amount: number;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  signedAt?: string | null;
  notes?: string | null;
  customerId: string;
  opportunityId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPlan {
  id: string;
  title: string;
  plannedAmount: number;
  receivedAmount: number;
  status: PaymentPlanStatus;
  plannedDate: string;
  notes?: string | null;
  customerId: string;
  opportunityId: string;
  contractId?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  receivedAt: string;
  note?: string | null;
  customerId: string;
  opportunityId: string;
  contractId?: string | null;
  paymentPlanId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RenewalReminder {
  id: string;
  title: string;
  remindAt: string;
  status: RenewalReminderStatus;
  note?: string | null;
  customerId: string;
  opportunityId?: string | null;
  contractId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type RevenueOperationRecord = Quote | Contract | PaymentPlan | PaymentRecord | RenewalReminder;

export interface RevenueOverviewBase {
  quotes: Quote[];
  contracts: Contract[];
  paymentPlans: PaymentPlan[];
  paymentRecords: PaymentRecord[];
  renewalReminders: RenewalReminder[];
}

export interface OpportunityRevenueOverview extends RevenueOverviewBase {
  opportunityId: string;
  customerId: string;
}

export interface CustomerRevenueOverview extends RevenueOverviewBase {
  customerId: string;
}

export interface QuoteFormModel {
  title: string;
  amount: number | null;
  issuedAt: string;
  expiresAt: string;
  notes: string;
}

export interface ContractFormModel {
  title: string;
  amount: number | null;
  startDate: string;
  endDate: string;
  signedAt: string;
  notes: string;
}

export interface PaymentPlanFormModel {
  title: string;
  plannedAmount: number | null;
  plannedDate: string;
  contractId: string;
  notes: string;
}

export interface PaymentRecordFormModel {
  paymentPlanId: string;
  amount: number | null;
  receivedAt: string;
  note: string;
}

export interface RenewalReminderFormModel {
  title: string;
  contractId: string;
  remindAt: string;
  note: string;
}

export interface CreateQuotePayload {
  customerId: string;
  opportunityId: string;
  title: string;
  amount: number;
  issuedAt?: string;
  expiresAt?: string;
  notes?: string;
}

export interface CreateContractPayload {
  customerId: string;
  opportunityId: string;
  title: string;
  amount: number;
  startDate: string;
  endDate: string;
  signedAt?: string;
  notes?: string;
}

export interface CreatePaymentPlanPayload {
  customerId: string;
  opportunityId: string;
  title: string;
  plannedAmount: number;
  plannedDate: string;
  contractId?: string;
  notes?: string;
}

export interface CreatePaymentRecordPayload {
  paymentPlanId: string;
  amount: number;
  receivedAt: string;
  note?: string;
}

export interface CreateRenewalReminderPayload {
  customerId: string;
  opportunityId?: string;
  contractId: string;
  title: string;
  remindAt: string;
  note?: string;
}
