/** 领域类型定义：负责维护当前子域的请求、响应和表单模型契约。 */
import type { User } from "@/types/access-control";
import type { PaginatedQuery, SortOrder } from "@/types/pagination";

export type OpportunityStage =
  | "DISCOVERY"
  | "QUALIFICATION"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export type OpportunityResultStatus = "IN_PROGRESS" | "WON" | "LOST";
export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type ContractStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
export type PaymentPlanStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
export type RenewalReminderStatus = "PENDING" | "CONTACTED" | "COMPLETED" | "DISMISSED";

export interface OpportunityCustomerSummary {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
}

export interface OpportunityLeadSummary {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
}

export interface OpportunityStageHistory {
  id: string;
  fromStage?: OpportunityStage | null;
  toStage: OpportunityStage;
  comment?: string | null;
  createdBy: User;
  createdAt: string;
}

export interface QuoteSummary {
  id: string;
  quoteNo: string;
  title: string;
  amount: number;
  status: QuoteStatus;
  issuedAt?: string | null;
  expiresAt?: string | null;
}

export interface ContractSummary {
  id: string;
  contractNo: string;
  title: string;
  amount: number;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  signedAt?: string | null;
}

export interface PaymentPlanSummary {
  id: string;
  title: string;
  plannedAmount: number;
  receivedAmount: number;
  status: PaymentPlanStatus;
  plannedDate: string;
}

export interface PaymentRecordSummary {
  id: string;
  amount: number;
  receivedAt: string;
  note?: string | null;
}

export interface RenewalReminderSummary {
  id: string;
  title: string;
  remindAt: string;
  status: RenewalReminderStatus;
  note?: string | null;
}

export interface Opportunity {
  id: string;
  name: string;
  customerId: string;
  customer: OpportunityCustomerSummary;
  sourceLeadId?: string | null;
  sourceLead?: OpportunityLeadSummary | null;
  ownerId: string;
  owner: User;
  stage: OpportunityStage;
  resultStatus: OpportunityResultStatus;
  expectedAmount: number;
  expectedCloseDate: string;
  nextAction: string;
  notes?: string | null;
  closedAt?: string | null;
  lostReason?: string | null;
  stageHistory?: OpportunityStageHistory[];
  quotes?: QuoteSummary[];
  contracts?: ContractSummary[];
  paymentPlans?: PaymentPlanSummary[];
  paymentRecords?: PaymentRecordSummary[];
  renewalReminders?: RenewalReminderSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityFilters {
  keyword: string;
  customerId: string;
  ownerId: string;
  stage: OpportunityStage | "";
  resultStatus: OpportunityResultStatus | "";
  expectedCloseDateRange: [string, string] | [] | null;
  closedAtRange: [string, string] | [] | null;
}

export interface OpportunityTableState extends PaginatedQuery {
  total: number;
  totalPages: number;
  sortBy: string;
  sortOrder: SortOrder;
  sortPreset: string;
}

export interface OpportunityFormModel {
  id: string;
  name: string;
  customerId: string;
  sourceLeadId: string;
  ownerId: string;
  stage: OpportunityStage;
  expectedAmount: number | null;
  expectedCloseDate: string;
  nextAction: string;
  notes: string;
}

export interface OpportunityOwnerFormModel {
  ownerId: string;
}

export interface OpportunityStageFormModel {
  stage: OpportunityStage;
  comment: string;
}

export interface OpportunityCloseFormModel {
  lostReason: string;
  comment: string;
}

export interface OpportunityListQuery extends PaginatedQuery {
  keyword?: string;
  customerId?: string;
  ownerId?: string;
  stage?: OpportunityStage;
  resultStatus?: OpportunityResultStatus;
  expectedCloseDateStart?: string;
  expectedCloseDateEnd?: string;
  closedAtStart?: string;
  closedAtEnd?: string;
}

export interface CreateOpportunityPayload {
  name: string;
  customerId: string;
  sourceLeadId?: string;
  ownerId: string;
  stage: OpportunityStage;
  expectedAmount: number;
  expectedCloseDate: string;
  nextAction: string;
  notes?: string;
}

export interface UpdateOpportunityPayload {
  name: string;
  sourceLeadId?: string | null;
  ownerId: string;
  expectedAmount: number;
  expectedCloseDate: string;
  nextAction: string;
  notes?: string | null;
}

export interface TransferOpportunityOwnerPayload {
  ownerId: string;
}

export interface AdvanceOpportunityStagePayload {
  stage: OpportunityStage;
  comment?: string;
}

export interface MarkOpportunityWonPayload {
  comment?: string;
}

export interface MarkOpportunityLostPayload {
  lostReason: string;
  comment?: string;
}
