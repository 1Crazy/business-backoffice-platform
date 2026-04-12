/** sales-opportunities 模块 mapper：负责把持久化结果转换为对外契约或上层可消费的数据结构。 */
import { Prisma } from "@prisma/client";

import { mapUserSummary } from "@/common/mappers/access-control.mapper";
import { toIsoString } from "@/common/mappers/date-time.mapper";
import { buildPaginatedResponse, type PaginationParams, type ResolvedSort } from "@/common/pagination/pagination.util";
import { resolveOpportunityResultStatus } from "../sales-opportunity.constants";
import type {
  OpportunityDetailRecord,
  OpportunityListRecord,
  OpportunityStageHistoryRecord
} from "../repositories/sales-opportunities.repository";

function mapOpportunityCustomer(record: OpportunityListRecord["customer"] | OpportunityDetailRecord["customer"]) {
  return {
    id: record.id,
    name: record.name,
    contactName: record.contactName ?? null,
    phone: record.phone ?? null
  };
}

function mapOpportunitySourceLead(
  record: OpportunityListRecord["sourceLead"] | OpportunityDetailRecord["sourceLead"] | null
) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    contactName: record.contactName ?? null,
    phone: record.phone ?? null
  };
}

function mapStageHistory(record: OpportunityStageHistoryRecord) {
  return {
    id: record.id,
    fromStage: record.fromStage ?? null,
    toStage: record.toStage,
    comment: record.comment ?? null,
    createdBy: mapUserSummary(record.createdBy),
    createdAt: toIsoString(record.createdAt)!
  };
}

function mapQuoteSummary(record: OpportunityDetailRecord["quotes"][number]) {
  return {
    id: record.id,
    quoteNo: record.quoteNo,
    title: record.title,
    amount: decimalToNumber(record.amount),
    status: record.status,
    issuedAt: toIsoString(record.issuedAt) ?? null,
    expiresAt: toIsoString(record.expiresAt) ?? null
  };
}

function mapContractSummary(record: OpportunityDetailRecord["contracts"][number]) {
  return {
    id: record.id,
    contractNo: record.contractNo,
    title: record.title,
    amount: decimalToNumber(record.amount),
    status: record.status,
    startDate: toIsoString(record.startDate)!,
    endDate: toIsoString(record.endDate)!,
    signedAt: toIsoString(record.signedAt) ?? null
  };
}

function mapPaymentPlanSummary(record: OpportunityDetailRecord["paymentPlans"][number]) {
  return {
    id: record.id,
    title: record.title,
    plannedAmount: decimalToNumber(record.plannedAmount),
    receivedAmount: decimalToNumber(record.receivedAmount),
    status: record.status,
    plannedDate: toIsoString(record.plannedDate)!
  };
}

function mapPaymentRecordSummary(record: OpportunityDetailRecord["paymentRecords"][number]) {
  return {
    id: record.id,
    amount: decimalToNumber(record.amount),
    receivedAt: toIsoString(record.receivedAt)!,
    note: record.note ?? null
  };
}

function mapRenewalReminderSummary(record: OpportunityDetailRecord["renewalReminders"][number]) {
  return {
    id: record.id,
    title: record.title,
    remindAt: toIsoString(record.remindAt)!,
    status: record.status,
    note: record.note ?? null
  };
}

export function mapSalesOpportunity(record: OpportunityListRecord | OpportunityDetailRecord) {
  return {
    id: record.id,
    name: record.name,
    customerId: record.customerId,
    customer: mapOpportunityCustomer(record.customer),
    sourceLeadId: record.sourceLeadId ?? null,
    sourceLead: mapOpportunitySourceLead(record.sourceLead),
    ownerId: record.ownerId,
    owner: mapUserSummary(record.owner),
    stage: record.stage,
    resultStatus: resolveOpportunityResultStatus(record.stage),
    expectedAmount: decimalToNumber(record.expectedAmount),
    expectedCloseDate: toIsoString(record.expectedCloseDate)!,
    nextAction: record.nextAction,
    notes: record.notes ?? null,
    closedAt: toIsoString(record.closedAt) ?? null,
    lostReason: record.lostReason ?? null,
    stageHistory: "stageHistory" in record ? record.stageHistory.map((item) => mapStageHistory(item)) : undefined,
    quotes: "quotes" in record ? record.quotes.map((item) => mapQuoteSummary(item)) : undefined,
    contracts: "contracts" in record ? record.contracts.map((item) => mapContractSummary(item)) : undefined,
    paymentPlans: "paymentPlans" in record ? record.paymentPlans.map((item) => mapPaymentPlanSummary(item)) : undefined,
    paymentRecords:
      "paymentRecords" in record ? record.paymentRecords.map((item) => mapPaymentRecordSummary(item)) : undefined,
    renewalReminders:
      "renewalReminders" in record ? record.renewalReminders.map((item) => mapRenewalReminderSummary(item)) : undefined,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapPaginatedSalesOpportunities(
  items: OpportunityListRecord[],
  total: number,
  pagination: PaginationParams,
  sort: ResolvedSort<string>
) {
  return buildPaginatedResponse(
    items.map((item) => mapSalesOpportunity(item)),
    total,
    pagination,
    sort
  );
}

function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value.toString());
}
