/** users 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditActionType, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { assertStrongPassword } from "@/common/security/password-policy.util";
import { mapUser } from "@/common/mappers/access-control.mapper";
import { TenantQuotaExceededException, TenantQuotaService } from "@/common/tenant/tenant-quota.service";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { UsersRepository } from "./repositories/users.repository";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const PASSWORD_HISTORY_LIMIT = 3;

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly tenantQuotaService: TenantQuotaService
  ) {}

  async list(actor: AuthUser) {
    const users = await this.usersRepository.list(requireTenantId(actor));

    return users.map((user) => mapUser(user));
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    assertStrongPassword(dto.password);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const tenantId = requireTenantId(actor);
    await this.assertUserQuotaAvailable(tenantId, actor, "user.create");
    const user = await this.usersRepository.createUser({
      tenantId,
      username: dto.username,
      displayName: dto.displayName,
      passwordHash,
      email: dto.email,
      phone: dto.phone,
      departmentId: dto.departmentId,
      roleIds: dto.roleIds
    });
    await this.usersRepository.createPasswordHistory(user.id, passwordHash);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "user",
      targetId: user.id
    });

    return mapUser(user);
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    let passwordHash: string | undefined;

    if (dto.password) {
      assertStrongPassword(dto.password);
      const user = await this.usersRepository.findById(id, tenantId);
      await this.assertPasswordHistory(user.id, user.passwordHash, dto.password);
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.usersRepository.updateUser(id, tenantId, {
      displayName: dto.displayName,
      email: dto.email === undefined ? undefined : dto.email,
      phone: dto.phone === undefined ? undefined : dto.phone,
      departmentId: dto.departmentId === undefined ? undefined : dto.departmentId,
      passwordHash,
      roleIds: dto.roleIds
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "user",
      targetId: user.id
    });

    return mapUser(user);
  }

  async toggle(id: string, status: UserStatus, actor: AuthUser) {
    const tenantId = requireTenantId(actor);

    if (status === UserStatus.ACTIVE) {
      await this.assertUserQuotaAvailable(tenantId, actor, "user.enable", id);
    }

    const user = await this.usersRepository.updateStatus(id, tenantId, status);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: status === UserStatus.ACTIVE ? AuditActionType.ENABLE : AuditActionType.DISABLE,
      targetType: "user",
      targetId: user.id
    });

    return mapUser(user);
  }

  async unlock(id: string, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const user = await this.usersRepository.unlockUser(id, tenantId);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.ENABLE,
      targetType: "user-lock",
      targetId: user.id,
      detail: {
        action: "security-review-clear"
      }
    });

    return mapUser(user);
  }

  private async assertUserQuotaAvailable(
    tenantId: string,
    actor: AuthUser,
    attemptedOperation: string,
    targetId?: string
  ): Promise<void> {
    try {
      await this.tenantQuotaService.assertUserQuotaAvailable(tenantId);
    } catch (error) {
      if (error instanceof TenantQuotaExceededException) {
        await this.auditQuotaRejection(actor, attemptedOperation, error, targetId);
      }

      throw error;
    }
  }

  private auditQuotaRejection(
    actor: AuthUser,
    attemptedOperation: string,
    error: TenantQuotaExceededException,
    targetId?: string
  ) {
    return this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.ACCESS_DENIED,
      targetType: "tenant-quota",
      targetId: targetId ?? requireTenantId(actor),
      detail: {
        attemptedOperation,
        quotaType: error.quota.type,
        limit: error.quota.limit,
        used: error.quota.used,
        requested: error.quota.requested,
        reason: error.quota.message
      }
    });
  }

  private async assertPasswordHistory(userId: string, currentPasswordHash: string, nextPassword: string) {
    if (await bcrypt.compare(nextPassword, currentPasswordHash)) {
      throw new BadRequestException("新密码不能与最近使用过的密码相同。");
    }

    const history = await this.usersRepository.listPasswordHistory(userId, PASSWORD_HISTORY_LIMIT);

    for (const item of history) {
      if (await bcrypt.compare(nextPassword, item.passwordHash)) {
        throw new BadRequestException("新密码不能与最近使用过的密码相同。");
      }
    }
  }
}
