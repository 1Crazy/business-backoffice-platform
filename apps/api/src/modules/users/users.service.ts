/** users 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { Injectable } from "@nestjs/common";
import { AuditActionType, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { mapUser } from "@/common/mappers/access-control.mapper";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { UsersRepository } from "./repositories/users.repository";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list() {
    const users = await this.usersRepository.list();

    return users.map((user) => mapUser(user));
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.createUser({
      username: dto.username,
      displayName: dto.displayName,
      passwordHash,
      email: dto.email,
      phone: dto.phone,
      departmentId: dto.departmentId,
      roleIds: dto.roleIds
    });

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
    const user = await this.usersRepository.updateUser(id, {
      displayName: dto.displayName,
      email: dto.email === undefined ? undefined : dto.email,
      phone: dto.phone === undefined ? undefined : dto.phone,
      departmentId: dto.departmentId === undefined ? undefined : dto.departmentId,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : undefined,
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
    const user = await this.usersRepository.updateStatus(id, status);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: status === UserStatus.ACTIVE ? AuditActionType.ENABLE : AuditActionType.DISABLE,
      targetType: "user",
      targetId: user.id
    });

    return mapUser(user);
  }
}
