/** audit-logs 模块 repository：负责 audit-logs 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { PaginationParams } from "@/common/pagination/pagination.util";
import { PrismaService } from "@/common/prisma/prisma.service";
import { DEFAULT_TENANT_CODE } from "@/common/tenant/tenant.constants";

export type AuditLogRecord = Prisma.AuditLogGetPayload<Record<string, never>>;

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    tenantId?: string;
    actorId?: string;
    actorName?: string;
    actionType: AuditLogRecord["actionType"];
    targetType: string;
    targetId?: string;
    detail?: Prisma.InputJsonValue;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const tenantId =
        input.tenantId ??
        (input.actorId
          ? (
              await tx.user.findFirst({
                where: {
                  id: input.actorId
                },
                select: {
                  tenantId: true
                }
              })
            )?.tenantId
          : null) ??
        (
          await tx.tenant.findFirst({
            where: {
              code: DEFAULT_TENANT_CODE
            },
            select: {
              id: true
            }
          })
        )?.id;

      if (!tenantId) {
        throw new Error("Default tenant is missing.");
      }

      return tx.auditLog.create({
        data: {
          tenantId,
          actorId: input.actorId,
          actorName: input.actorName,
          actionType: input.actionType,
          targetType: input.targetType,
          targetId: input.targetId,
          detail: input.detail
        }
      });
    });
  }

  async list(
    tenantId: string | undefined,
    where: Prisma.AuditLogWhereInput,
    orderBy: Prisma.AuditLogOrderByWithRelationInput[],
    pagination: PaginationParams
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where: tenantId
          ? {
              AND: [{ tenantId }, where]
            }
          : where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.auditLog.count({
        where: tenantId
          ? {
              AND: [{ tenantId }, where]
            }
          : where
      })
    ]);

    return {
      items,
      total
    };
  }
}
