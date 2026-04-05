import { Injectable } from "@nestjs/common";
import { AuditActionType, RecordStatus } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list() {
    return this.prisma.department.findMany({
      include: {
        parent: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async create(dto: CreateDepartmentDto, actor: AuthUser) {
    const department = await this.prisma.department.create({
      data: {
        name: dto.name,
        code: dto.code,
        parentId: dto.parentId ?? undefined
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "department",
      targetId: department.id
    });

    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto, actor: AuthUser) {
    const department = await this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        parentId: dto.parentId === undefined ? undefined : dto.parentId
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "department",
      targetId: department.id
    });

    return department;
  }

  async toggle(id: string, status: RecordStatus, actor: AuthUser) {
    const department = await this.prisma.department.update({
      where: { id },
      data: {
        status
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: status === RecordStatus.ACTIVE ? AuditActionType.ENABLE : AuditActionType.DISABLE,
      targetType: "department",
      targetId: department.id
    });

    return department;
  }
}
