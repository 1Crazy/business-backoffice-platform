/** roles 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { Injectable } from "@nestjs/common";
import { AuditActionType, DataScope, Prisma, RecordStatus } from "@prisma/client";

import { mapPermission, mapRole } from "@/common/mappers/access-control.mapper";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { RolesRepository } from "./repositories/roles.repository";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list(actor: AuthUser) {
    const roles = await this.rolesRepository.list(requireTenantId(actor));

    return roles.map((role) => mapRole(role));
  }

  async getPermissionCatalog() {
    const permissions = await this.rolesRepository.listPermissionCatalog();

    return permissions.map((permission) => mapPermission(permission));
  }

  async create(dto: CreateRoleDto, actor: AuthUser) {
    const role = await this.rolesRepository.createRole({
      tenantId: requireTenantId(actor),
      name: dto.name,
      code: dto.code,
      description: dto.description,
      isSystem: dto.isSystem ?? false,
      dataScope: dto.dataScope ?? DataScope.SELF,
      permissionIds: dto.permissionIds,
      extendedDataScopes: toJsonValue(dto.policyBundle?.extendedDataScopes),
      fieldPermissionRules: toJsonValue(dto.policyBundle?.fieldPermissionRules),
      actionPermissionRules: toJsonValue(dto.policyBundle?.actionPermissionRules)
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "role",
      targetId: role.id
    });

    return mapRole(role);
  }

  async update(id: string, dto: UpdateRoleDto, actor: AuthUser) {
    const role = await this.rolesRepository.updateRole(id, requireTenantId(actor), {
      name: dto.name,
      description: dto.description === undefined ? undefined : dto.description,
      isSystem: dto.isSystem,
      dataScope: dto.dataScope,
      permissionIds: dto.permissionIds,
      extendedDataScopes: toJsonValue(dto.policyBundle?.extendedDataScopes),
      fieldPermissionRules: toJsonValue(dto.policyBundle?.fieldPermissionRules),
      actionPermissionRules: toJsonValue(dto.policyBundle?.actionPermissionRules)
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "role",
      targetId: role.id
    });

    return mapRole(role);
  }

  async toggle(id: string, status: RecordStatus, actor: AuthUser) {
    const role = await this.rolesRepository.updateStatus(id, requireTenantId(actor), status);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: status === RecordStatus.ACTIVE ? AuditActionType.ENABLE : AuditActionType.DISABLE,
      targetType: "role",
      targetId: role.id
    });

    return mapRole(role);
  }
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return (value ?? []) as Prisma.InputJsonValue;
}
