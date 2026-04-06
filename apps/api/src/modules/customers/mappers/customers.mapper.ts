/** customers 模块 mapper：负责把持久化结果转换为对外契约或上层可消费的数据结构。 */
import { buildPaginatedResponse, type PaginationParams, type ResolvedSort } from "@/common/pagination/pagination.util";
import { mapUserSummary } from "@/common/mappers/access-control.mapper";
import { mapAttachment, mapFollowUp } from "@/common/mappers/entity.mapper";
import { toIsoString } from "@/common/mappers/date-time.mapper";
import type {
  CustomerDetailRecord,
  CustomerFollowUpRecord,
  CustomerListRecord,
  CustomerTagRecord
} from "../repositories/customers.repository";

interface CustomerTagRelationRecord {
  tag: CustomerTagRecord;
}

export function mapCustomerTag(record: CustomerTagRecord) {
  return {
    id: record.id,
    name: record.name,
    color: record.color ?? null
  };
}

function mapCustomerTagRelation(record: CustomerTagRelationRecord) {
  return {
    tag: mapCustomerTag(record.tag)
  };
}

export function mapCustomer(record: CustomerListRecord | CustomerDetailRecord) {
  return {
    id: record.id,
    name: record.name,
    contactName: record.contactName ?? null,
    phone: record.phone ?? null,
    email: record.email ?? null,
    source: record.source ?? null,
    status: record.status ?? null,
    notes: record.notes ?? null,
    ownerId: record.ownerId,
    owner: mapUserSummary(record.owner),
    tags: record.tags.map(mapCustomerTagRelation),
    attachments: "attachments" in record ? record.attachments.map(mapAttachment) : undefined,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapCustomerFollowUp(record: CustomerFollowUpRecord) {
  return mapFollowUp(record);
}

export function mapPaginatedCustomers(
  items: CustomerListRecord[],
  total: number,
  pagination: PaginationParams,
  sort: ResolvedSort<string>
) {
  return buildPaginatedResponse(
    items.map((item) => mapCustomer(item)),
    total,
    pagination,
    sort
  );
}
