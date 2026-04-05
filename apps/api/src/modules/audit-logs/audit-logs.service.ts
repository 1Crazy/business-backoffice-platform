import { Injectable } from "@nestjs/common";
import { AuditActionType, Prisma } from "@prisma/client";

import {
  buildPaginatedResponse,
  getPaginationParams,
  resolveSort
} from "../../common/pagination/pagination.util";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AUDIT_LOG_SORT_FIELDS, type AuditLogSortField, ListAuditLogsDto } from "./dto/list-audit-logs.dto";

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
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        actorName: input.actorName,
        actionType: input.actionType,
        targetType: input.targetType,
        targetId: input.targetId,
        detail: input.detail
      }
    });
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
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return buildPaginatedResponse(items, total, pagination, sort);
  }
}
