import { buildPaginatedResponse, type PaginationParams, type ResolvedSort } from "../../../common/pagination/pagination.util";
import { mapUserSummary } from "../../../common/mappers/access-control.mapper";
import { mapAttachment, mapFollowUp } from "../../../common/mappers/entity.mapper";
import { toIsoString } from "../../../common/mappers/date-time.mapper";
import type {
  LeadDetailRecord,
  LeadFollowUpRecord,
  LeadListRecord,
  LeadReminderRecord
} from "../repositories/leads.repository";

function mapConvertedCustomer(
  record: NonNullable<LeadListRecord["convertedCustomer"]> | NonNullable<LeadDetailRecord["convertedCustomer"]>
) {
  return {
    id: record.id,
    name: record.name,
    contactName: record.contactName ?? null,
    phone: record.phone ?? null,
    source: record.source ?? null,
    status: record.status ?? null,
    ownerId: record.ownerId
  };
}

export function mapLead(record: LeadListRecord | LeadDetailRecord) {
  return {
    id: record.id,
    name: record.name,
    contactName: record.contactName ?? null,
    phone: record.phone ?? null,
    source: record.source ?? null,
    status: record.status,
    notes: record.notes ?? null,
    ownerId: record.ownerId,
    owner: mapUserSummary(record.owner),
    convertedCustomerId: record.convertedCustomerId ?? null,
    convertedCustomer: record.convertedCustomer ? mapConvertedCustomer(record.convertedCustomer) : null,
    attachments: "attachments" in record ? record.attachments.map(mapAttachment) : undefined,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapLeadFollowUp(record: LeadFollowUpRecord) {
  return mapFollowUp(record);
}

export function mapLeadReminder(record: LeadReminderRecord) {
  return {
    id: record.id,
    entityType: record.entityType,
    status: record.status,
    remindAt: toIsoString(record.remindAt)!,
    lead: record.lead
      ? {
          id: record.lead.id,
          name: record.lead.name,
          contactName: record.lead.contactName ?? null,
          phone: record.lead.phone ?? null
        }
      : null,
    customer: record.customer
      ? {
          id: record.customer.id,
          name: record.customer.name,
          contactName: record.customer.contactName ?? null
        }
      : null,
    followUp: record.followUp
      ? {
          id: record.followUp.id,
          content: record.followUp.content,
          nextFollowUpAt: toIsoString(record.followUp.nextFollowUpAt)
        }
      : null,
    owner: mapUserSummary(record.owner),
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapPaginatedLeads(
  items: LeadListRecord[],
  total: number,
  pagination: PaginationParams,
  sort: ResolvedSort<string>
) {
  return buildPaginatedResponse(
    items.map((item) => mapLead(item)),
    total,
    pagination,
    sort
  );
}

export function mapPaginatedLeadReminders(
  items: LeadReminderRecord[],
  total: number,
  pagination: PaginationParams,
  sort: ResolvedSort<string>
) {
  return buildPaginatedResponse(
    items.map((item) => mapLeadReminder(item)),
    total,
    pagination,
    sort
  );
}
