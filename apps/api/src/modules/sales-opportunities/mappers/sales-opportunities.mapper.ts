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
