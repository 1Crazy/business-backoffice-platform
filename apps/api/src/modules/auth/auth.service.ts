import { createHash, randomBytes } from "crypto";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuditActionType, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { mapAuthUser } from "./mappers/auth.mapper";
import { AuthRepository } from "./repositories/auth.repository";

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.authRepository.findUserByUsername(dto.username);

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

    const authUser = mapAuthUser(user);
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
    const session = await this.authRepository.findSessionByRefreshTokenHash(this.hashRefreshToken(dto.refreshToken));

    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== UserStatus.ACTIVE) {
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

    await this.authRepository.revokeSession(user.sessionId, user.id);

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
    if (!payload.sessionId) {
      throw new UnauthorizedException("Session is invalid.");
    }

    const [user, session] = await Promise.all([
      this.authRepository.findUserByUsername(payload.username).then((foundUser) => {
        if (foundUser?.id === payload.id) {
          return foundUser;
        }

        return this.authRepository.findUserById(payload.id);
      }),
      this.authRepository.findSessionById(payload.sessionId)
    ]);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Session is invalid.");
    }

    if (!session || session.userId !== user.id || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Session is invalid.");
    }

    return {
      ...mapAuthUser(user),
      sessionId: session.id
    };
  }

  private async createUserSession(userId: string) {
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const session = await this.authRepository.createUserSession(userId, this.hashRefreshToken(refreshToken), expiresAt);

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
