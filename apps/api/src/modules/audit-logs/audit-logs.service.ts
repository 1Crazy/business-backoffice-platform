/** audit-logs 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { Injectable } from "@nestjs/common";
import { AuditActionType, Prisma } from "@prisma/client";

import {
  getPaginationParams,
  resolveSort
} from "@/common/pagination/pagination.util";
import { AUDIT_LOG_SORT_FIELDS, type AuditLogSortField, ListAuditLogsDto } from "./dto/list-audit-logs.dto";
import { mapPaginatedAuditLogs } from "./mappers/audit-logs.mapper";
import { AuditLogsRepository } from "./repositories/audit-logs.repository";

interface CreateAuditLogInput {
  actorId?: string;
  actorName?: string;
  actionType: AuditActionType;
  targetType: string;
  targetId?: string;
  detail?: Prisma.InputJsonValue;
}

const AUDIT_LOG_DEFAULT_SORT: { field: AuditLogSortField; order: Prisma.SortOrder } = {
  field: "createdAt",
  order: "desc"
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async create(input: CreateAuditLogInput): Promise<void> {
    await this.auditLogsRepository.create(input);
  }

  async list(query: ListAuditLogsDto) {
    const pagination = getPaginationParams(query);
    const sort = resolveSort(query, AUDIT_LOG_SORT_FIELDS, AUDIT_LOG_DEFAULT_SORT);
    const where: Prisma.AuditLogWhereInput = {
      actionType: query.actionType,
      targetType: query.targetType,
      targetId: query.targetId,
      actorId: query.actorId,
      actorName: query.actorName
        ? {
            contains: query.actorName,
            mode: "insensitive"
          }
        : undefined,
      createdAt:
        query.startDate || query.endDate
          ? {
              gte: query.startDate ? new Date(query.startDate) : undefined,
              lte: query.endDate ? new Date(query.endDate) : undefined
            }
          : undefined
    };
    const orderBy: Prisma.AuditLogOrderByWithRelationInput[] = [
      { [sort.field]: sort.order } as Prisma.AuditLogOrderByWithRelationInput,
      { id: "desc" }
    ];
    const { items, total } = await this.auditLogsRepository.list(where, orderBy, pagination);

    return mapPaginatedAuditLogs(items, total, pagination, sort);
  }
}
