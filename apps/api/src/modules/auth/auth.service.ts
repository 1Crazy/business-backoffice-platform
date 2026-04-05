import { createHash, randomBytes } from "crypto";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuditActionType, DataScope, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

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
      await this.auditLogsService.create({
        actorId: user?.id,
        actorName: user?.displayName ?? dto.username,
        actionType: AuditActionType.SIGN_IN_FAILED,
        targetType: "auth",
        targetId: user?.id,
        detail: {
          username: dto.username,
          reason: user ? "inactive_user" : "invalid_username"
        }
      });
      throw new UnauthorizedException("Invalid credentials.");
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValidPassword) {
      await this.auditLogsService.create({
        actorId: user.id,
        actorName: user.displayName,
        actionType: AuditActionType.SIGN_IN_FAILED,
        targetType: "auth",
        targetId: user.id,
        detail: {
          username: dto.username,
          reason: "invalid_password"
        }
      });
      throw new UnauthorizedException("Invalid credentials.");
    }

    const authUser = this.mapAuthUser(user);
    const session = await this.createUserSession(user.id);

    await this.auditLogsService.create({
      actorId: user.id,
      actorName: user.displayName,
      actionType: AuditActionType.SIGN_IN,
      targetType: "auth",
      targetId: user.id
    });

    return {
      accessToken: await this.signAccessToken({
        ...authUser,
        sessionId: session.id
      }),
      refreshToken: session.refreshToken,
      sessionExpiresAt: session.expiresAt.toISOString(),
      user: authUser
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const session = await this.prisma.userSession.findUnique({
      where: {
        refreshTokenHash: this.hashRefreshToken(dto.refreshToken)
      },
      include: {
        user: {
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
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Session is invalid.");
    }

    const authUser = this.mapAuthUser(session.user, session.id);

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        lastSeenAt: new Date()
      }
    });

    return {
      accessToken: await this.signAccessToken(authUser),
      refreshToken: dto.refreshToken,
      sessionExpiresAt: session.expiresAt.toISOString(),
      user: this.mapAuthUser(session.user)
    };
  }

  async logout(user: AuthUser) {
    if (!user.sessionId) {
      throw new UnauthorizedException("Missing active session.");
    }

    await this.prisma.userSession.updateMany({
      where: {
        id: user.sessionId,
        userId: user.id,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    await this.auditLogsService.create({
      actorId: user.id,
      actorName: user.displayName,
      actionType: AuditActionType.SESSION_REVOKE,
      targetType: "auth-session",
      targetId: user.sessionId
    });

    return {
      success: true
    };
  }

  async getProfile(userId: string, sessionId?: string): Promise<AuthUser> {
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

    return this.mapAuthUser(user, sessionId);
  }

  async validateSessionPayload(payload: AuthUser): Promise<AuthUser> {
    if (!payload.sessionId) {
      throw new UnauthorizedException("Session is invalid.");
    }

    const [user, session] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: payload.id },
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
      }),
      this.prisma.userSession.findUnique({
        where: {
          id: payload.sessionId
        }
      })
    ]);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Session is invalid.");
    }

    if (!session || session.userId !== user.id || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Session is invalid.");
    }

    return this.mapAuthUser(user, session.id);
  }

  private mapAuthUser(
    user: {
      id: string;
      username: string;
      displayName: string;
      departmentId?: string | null;
      roles: Array<{
        role: {
          code: string;
          dataScope: DataScope;
          permissions: Array<{ permission: { code: string } }>;
        };
      }>;
    },
    sessionId?: string
  ): AuthUser {
    const roleCodes = user.roles.map((item: { role: { code: string } }) => item.role.code);
    const permissions = Array.from(
      new Set(
        user.roles.flatMap((item: { role: { permissions: Array<{ permission: { code: string } }> } }) =>
          item.role.permissions.map((permission: { permission: { code: string } }) => permission.permission.code)
        )
      )
    );
    const dataScopes = Array.from(new Set(user.roles.map((item: { role: { dataScope: DataScope } }) => item.role.dataScope)));

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      departmentId: user.departmentId,
      roleCodes,
      permissions,
      dataScopes,
      sessionId
    };
  }

  private async createUserSession(userId: string) {
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
        lastSeenAt: new Date()
      }
    });

    return {
      id: session.id,
      refreshToken,
      expiresAt
    };
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  private signAccessToken(payload: AuthUser) {
    return this.jwtService.signAsync(payload);
  }
}
