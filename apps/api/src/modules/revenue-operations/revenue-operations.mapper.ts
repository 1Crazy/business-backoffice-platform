import { Prisma } from "@prisma/client";

import { toIsoString } from "@/common/mappers/date-time.mapper";
import type {
  ContractRecord,
  CustomerRevenueOverviewRecord,
  OpportunityRevenueOverviewRecord,
  PaymentPlanRecord,
  PaymentRecordRecord,
  QuoteRecord,
  RenewalReminderRecord
} from "./revenue-operations.repository";

function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value.toString());
}

export function mapQuote(record: QuoteRecord) {
  return {
    id: record.id,
    quoteNo: record.quoteNo,
    title: record.title,
    amount: decimalToNumber(record.amount),
    status: record.status,
    issuedAt: toIsoString(record.issuedAt) ?? null,
    expiresAt: toIsoString(record.expiresAt) ?? null,
    notes: record.notes ?? null,
    customerId: record.customerId,
    opportunityId: record.opportunityId,
    ownerId: record.ownerId,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapContract(record: ContractRecord) {
  return {
    id: record.id,
    contractNo: record.contractNo,
    title: record.title,
    amount: decimalToNumber(record.amount),
    status: record.status,
    startDate: toIsoString(record.startDate)!,
    endDate: toIsoString(record.endDate)!,
    signedAt: toIsoString(record.signedAt) ?? null,
    notes: record.notes ?? null,
    customerId: record.customerId,
    opportunityId: record.opportunityId,
    ownerId: record.ownerId,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapPaymentPlan(record: PaymentPlanRecord) {
  return {
    id: record.id,
    title: record.title,
    plannedAmount: decimalToNumber(record.plannedAmount),
    receivedAmount: decimalToNumber(record.receivedAmount),
    status: record.status,
    plannedDate: toIsoString(record.plannedDate)!,
    notes: record.notes ?? null,
    customerId: record.customerId,
    opportunityId: record.opportunityId,
    contractId: record.contractId ?? null,
    ownerId: record.ownerId,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapPaymentRecord(record: PaymentRecordRecord) {
  return {
    id: record.id,
    amount: decimalToNumber(record.amount),
    receivedAt: toIsoString(record.receivedAt)!,
    note: record.note ?? null,
    customerId: record.customerId,
    opportunityId: record.opportunityId,
    contractId: record.contractId ?? null,
    paymentPlanId: record.paymentPlanId,
    ownerId: record.ownerId,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapRenewalReminder(record: RenewalReminderRecord) {
  return {
    id: record.id,
    title: record.title,
    remindAt: toIsoString(record.remindAt)!,
    status: record.status,
    note: record.note ?? null,
    customerId: record.customerId,
    opportunityId: record.opportunityId ?? null,
    contractId: record.contractId,
    ownerId: record.ownerId,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapOpportunityRevenueOverview(record: OpportunityRevenueOverviewRecord) {
  return {
    opportunityId: record.id,
    customerId: record.customerId,
    quotes: record.quotes.map((item) => mapQuote(item)),
    contracts: record.contracts.map((item) => mapContract(item)),
    paymentPlans: record.paymentPlans.map((item) => mapPaymentPlan(item)),
    paymentRecords: record.paymentRecords.map((item) => mapPaymentRecord(item)),
    renewalReminders: record.renewalReminders.map((item) => mapRenewalReminder(item))
  };
}

export function mapCustomerRevenueOverview(record: CustomerRevenueOverviewRecord) {
  return {
    customerId: record.id,
    quotes: record.quotes.map((item) => mapQuote(item)),
    contracts: record.contracts.map((item) => mapContract(item)),
    paymentPlans: record.paymentPlans.map((item) => mapPaymentPlan(item)),
    paymentRecords: record.paymentRecords.map((item) => mapPaymentRecord(item)),
    renewalReminders: record.renewalReminders.map((item) => mapRenewalReminder(item))
  };
}
