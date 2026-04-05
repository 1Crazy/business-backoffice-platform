import { Injectable } from "@nestjs/common";
import { AuditActionType, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list() {
    return this.prisma.user.findMany({
      include: {
        department: true,
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        displayName: dto.displayName,
        passwordHash,
        email: dto.email ?? undefined,
        phone: dto.phone ?? undefined,
        departmentId: dto.departmentId ?? undefined,
        roles: {
          createMany: {
            data: dto.roleIds.map((roleId) => ({ roleId }))
          }
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "user",
      targetId: user.id
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const data = {
      displayName: dto.displayName,
      email: dto.email === undefined ? undefined : dto.email,
      phone: dto.phone === undefined ? undefined : dto.phone,
      departmentId: dto.departmentId === undefined ? undefined : dto.departmentId,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : undefined
    };

    const user = await this.prisma.$transaction(async (tx) => {
      if (dto.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (dto.roleIds.length) {
          await tx.userRole.createMany({
            data: dto.roleIds.map((roleId) => ({
              userId: id,
              roleId
            }))
          });
        }
      }

      return tx.user.update({
        where: { id },
        data,
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "user",
      targetId: user.id
    });

    return user;
  }

  async toggle(id: string, status: UserStatus, actor: AuthUser) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: status === UserStatus.ACTIVE ? AuditActionType.ENABLE : AuditActionType.DISABLE,
      targetType: "user",
      targetId: user.id
    });

    return user;
  }
}
