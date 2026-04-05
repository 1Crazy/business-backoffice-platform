import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuditActionType, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const authUser = this.mapAuthUser(user);

    await this.auditLogsService.create({
      actorId: user.id,
      actorName: user.displayName,
      actionType: AuditActionType.SIGN_IN,
      targetType: "auth",
      targetId: user.id
    });

    return {
      accessToken: await this.jwtService.signAsync(authUser),
      user: authUser
    };
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return this.mapAuthUser(user);
  }

  private mapAuthUser(
    user: Awaited<ReturnType<PrismaService["user"]["findUnique"]>> & {
      roles: Array<{
        role: {
          code: string;
          permissions: Array<{ permission: { code: string } }>;
        };
      }>;
    }
  ): AuthUser {
    const roleCodes = user.roles.map((item) => item.role.code);
    const permissions = Array.from(
      new Set(user.roles.flatMap((item) => item.role.permissions.map((permission) => permission.permission.code)))
    );

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      departmentId: user.departmentId,
      roleCodes,
      permissions
    };
  }
}

