/** audit-logs 模块 repository：负责 audit-logs 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { PaginationParams } from "@/common/pagination/pagination.util";
import { PrismaService } from "@/common/prisma/prisma.service";

export type AuditLogRecord = Prisma.AuditLogGetPayload<Record<string, never>>;

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    actorId?: string;
    actorName?: string;
    actionType: AuditLogRecord["actionType"];
    targetType: string;
    targetId?: string;
    detail?: Prisma.InputJsonValue;
  }) {
    return this.prisma.auditLog.create({
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

  async list(
    where: Prisma.AuditLogWhereInput,
    orderBy: Prisma.AuditLogOrderByWithRelationInput[],
    pagination: PaginationParams
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return {
      items,
      total
    };
  }
}
