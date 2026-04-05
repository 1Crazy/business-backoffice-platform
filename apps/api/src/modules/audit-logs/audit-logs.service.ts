import { Injectable } from "@nestjs/common";
import { AuditActionType, Prisma } from "@prisma/client";

import { PrismaService } from "../../common/prisma/prisma.service";
import { ListAuditLogsDto } from "./dto/list-audit-logs.dto";

interface CreateAuditLogInput {
  actorId?: string;
  actorName?: string;
  actionType: AuditActionType;
  targetType: string;
  targetId?: string;
  detail?: Prisma.InputJsonValue;
}

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
    return this.prisma.auditLog.findMany({
      where: {
        actionType: query.actionType as AuditActionType | undefined,
        targetType: query.targetType,
        actorName: query.actorName
          ? {
              contains: query.actorName,
              mode: "insensitive"
            }
          : undefined
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
}

