import { buildPaginatedResponse, type PaginationParams, type ResolvedSort } from "../../../common/pagination/pagination.util";
import { toIsoString } from "../../../common/mappers/date-time.mapper";
import type { AuditLogRecord } from "../repositories/audit-logs.repository";

export function mapAuditLog(record: AuditLogRecord) {
  return {
    id: record.id,
    actorId: record.actorId ?? null,
    actorName: record.actorName ?? null,
    actionType: record.actionType,
    targetType: record.targetType,
    targetId: record.targetId ?? null,
    detail: (record.detail as Record<string, unknown> | null) ?? null,
    createdAt: toIsoString(record.createdAt)!
  };
}

export function mapPaginatedAuditLogs(
  items: AuditLogRecord[],
  total: number,
  pagination: PaginationParams,
  sort: ResolvedSort<string>
) {
  return buildPaginatedResponse(
    items.map((item) => mapAuditLog(item)),
    total,
    pagination,
    sort
  );
}
