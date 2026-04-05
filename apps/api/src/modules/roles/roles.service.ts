import { Injectable } from "@nestjs/common";
import { AuditActionType, RecordStatus } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async getPermissionCatalog() {
    return this.prisma.permission.findMany({
      orderBy: [{ group: "asc" }, { name: "asc" }]
    });
  }

  async create(dto: CreateRoleDto, actor: AuthUser) {
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description ?? undefined,
        isSystem: dto.isSystem ?? false,
        permissions: {
          createMany: {
            data: dto.permissionIds.map((permissionId) => ({ permissionId }))
          }
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "role",
      targetId: role.id
    });

    return role;
  }

  async update(id: string, dto: UpdateRoleDto, actor: AuthUser) {
    const role = await this.prisma.$transaction(async (tx) => {
      if (dto.permissionIds) {
        await tx.rolePermission.deleteMany({
          where: { roleId: id }
        });
        if (dto.permissionIds.length) {
          await tx.rolePermission.createMany({
            data: dto.permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId
            }))
          });
        }
      }

      return tx.role.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description === undefined ? undefined : dto.description,
          isSystem: dto.isSystem
        },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "role",
      targetId: role.id
    });

    return role;
  }

  async toggle(id: string, status: RecordStatus, actor: AuthUser) {
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        status
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: status === RecordStatus.ACTIVE ? AuditActionType.ENABLE : AuditActionType.DISABLE,
      targetType: "role",
      targetId: role.id
    });

    return role;
  }
}
