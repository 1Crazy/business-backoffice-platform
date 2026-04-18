/** auth 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { createHash, randomBytes } from "crypto";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuditActionType, Prisma, RecordStatus, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { mapAuthUser } from "./mappers/auth.mapper";
import { AuthRepository, type AuthUserRecord } from "./repositories/auth.repository";

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

interface LoginAuditContext {
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.authRepository.findUserByUsername(dto.username);
    const isTenantUnavailable = !user?.tenant || user.tenant.status !== RecordStatus.ACTIVE || Boolean(user.tenant.archivedAt);
    const isUserUnavailable = !user || user.status !== UserStatus.ACTIVE;

    if (!user || isUserUnavailable || isTenantUnavailable) {
      await this.auditLogsService.create({
        actorId: user?.id,
        actorName: user?.displayName ?? dto.username,
        actionType: AuditActionType.SIGN_IN_FAILED,
        targetType: "auth",
        targetId: user?.id,
        detail: {
          username: dto.username,
          reason: !user ? "invalid_username" : isTenantUnavailable ? "inactive_tenant" : "inactive_user"
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

    return this.loginWithUser(user, {
      targetType: "auth",
      targetId: user.id,
      detail: {
        loginType: "password"
      }
    });
  }

  async loginWithUser(user: AuthUserRecord, auditContext: LoginAuditContext = {}) {
    if (!this.isLoginUserAvailable(user)) {
      throw new UnauthorizedException("User is unavailable.");
    }

    return this.issueLoginResponse(user, auditContext);
  }

  async refresh(dto: RefreshTokenDto) {
    const session = await this.authRepository.findSessionByRefreshTokenHash(this.hashRefreshToken(dto.refreshToken));

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== UserStatus.ACTIVE ||
      session.user.tenant.status !== RecordStatus.ACTIVE ||
      Boolean(session.user.tenant.archivedAt) ||
      session.user.tenantId !== session.tenantId
    ) {
      throw new UnauthorizedException("Session is invalid.");
    }

    const authUser = {
      ...mapAuthUser(session.user),
      sessionId: session.id
    };

    await this.authRepository.touchSession(session.id);

    return {
      accessToken: await this.signAccessToken(authUser),
      refreshToken: dto.refreshToken,
      sessionExpiresAt: session.expiresAt.toISOString(),
      user: mapAuthUser(session.user)
    };
  }

  async logout(user: AuthUser) {
    if (!user.sessionId) {
      throw new UnauthorizedException("Missing active session.");
    }

    await this.authRepository.revokeSession(user.sessionId, user.id, requireTenantId(user));

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
    const user = await this.authRepository.findUserById(userId);

    return mapAuthUser(user);
  }

  async validateSessionPayload(payload: AuthUser): Promise<AuthUser> {
    if (!payload.sessionId || !payload.tenantId) {
      throw new UnauthorizedException("Session is invalid.");
    }

    const [user, session] = await Promise.all([
      this.authRepository.findUserByUsername(payload.username).then((foundUser) => {
        if (foundUser?.id === payload.id && foundUser?.tenantId === payload.tenantId) {
          return foundUser;
        }

        return this.authRepository.findUserById(payload.id, payload.tenantId);
      }),
      this.authRepository.findSessionById(payload.sessionId, payload.tenantId)
    ]);

    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      user.tenant.status !== RecordStatus.ACTIVE ||
      Boolean(user.tenant.archivedAt)
    ) {
      throw new UnauthorizedException("Session is invalid.");
    }

    if (
      !session ||
      session.userId !== user.id ||
      session.tenantId !== payload.tenantId ||
      session.tenantId !== user.tenantId ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException("Session is invalid.");
    }

    return {
      ...mapAuthUser(user),
      sessionId: session.id
    };
  }

  private async createUserSession(userId: string, tenantId: string) {
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const session = await this.authRepository.createUserSession(
      userId,
      tenantId,
      this.hashRefreshToken(refreshToken),
      expiresAt
    );

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

  private isLoginUserAvailable(user: AuthUserRecord): boolean {
    return (
      user.status === UserStatus.ACTIVE &&
      Boolean(user.tenant) &&
      user.tenant.status === RecordStatus.ACTIVE &&
      !user.tenant.archivedAt
    );
  }

  private async issueLoginResponse(user: AuthUserRecord, auditContext: LoginAuditContext) {
    const authUser = mapAuthUser(user);
    const session = await this.createUserSession(user.id, user.tenantId);

    await this.auditLogsService.create({
      actorId: user.id,
      actorName: user.displayName,
      actionType: AuditActionType.SIGN_IN,
      targetType: auditContext.targetType ?? "auth",
      targetId: auditContext.targetId ?? user.id,
      detail: auditContext.detail as Prisma.InputJsonObject | undefined
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
}
