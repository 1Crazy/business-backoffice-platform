/** auth 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { createHash, createHmac, randomBytes } from "crypto";

import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuditActionType, Prisma, RecordStatus, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { assertStrongPassword } from "@/common/security/password-policy.util";
import { RiskThrottleService } from "@/common/security/risk-throttle.service";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { NotificationCenterService } from "../notification-center/notification-center.service";
import { ConfigureMfaDto } from "./dto/configure-mfa.dto";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { VerifyLoginMfaDto } from "./dto/verify-login-mfa.dto";
import { VerifyMfaDto } from "./dto/verify-mfa.dto";
import { mapAuthUser } from "./mappers/auth.mapper";
import { AuthRepository, type AuthSessionListRecord, type AuthUserRecord } from "./repositories/auth.repository";

const REFRESH_TOKEN_BYTES = 48;
const PASSWORD_RESET_TOKEN_BYTES = 24;
const PASSWORD_HISTORY_LIMIT = 3;
const PASSWORD_RESET_TTL_MS = 1000 * 60 * 15;
const MFA_RECOVERY_CODE_COUNT = 5;
const MFA_RECOVERY_CODE_LENGTH = 10;
const MFA_LOGIN_CHALLENGE_TTL_MS = 1000 * 60 * 5;
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const LOGIN_THROTTLE = {
  maxAttempts: 5,
  windowMs: 1000 * 60 * 10,
  lockMs: 1000 * 60 * 15
};
const REFRESH_THROTTLE = {
  maxAttempts: 10,
  windowMs: 1000 * 60 * 10,
  lockMs: 1000 * 60 * 15
};
const PASSWORD_LOCK_THRESHOLD = 10;
const MFA_ISSUER = "business-backoffice-platform";
const MFA_REQUIRED_ROLE_CODES = new Set(["super-admin", "tenant-admin"]);
const MFA_REQUIRED_PERMISSIONS = new Set(["user:write", "dictionary:write"]);
type SecurityLockStatus = "NONE" | "REVIEW_REQUIRED" | "LOCKED";

interface LoginAuditContext {
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
}

interface RefreshSessionInput {
  refreshToken?: string;
}

interface SessionListItem {
  id: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
  lastSeenAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  isCurrent: boolean;
  isActive: boolean;
}

interface SuccessfulLoginResponse {
  success: true;
  mfaRequired: false;
  mfaEnrollmentRequired: false;
  mfaTicket: null;
  mfaChallengeType: null;
  mfaSetupChallenge: null;
  mfaRecoveryCodes: string[];
  accessToken: string;
  refreshToken: string;
  sessionExpiresAt: string;
  user: AuthUser;
}

interface PendingMfaLoginResponse {
  success: false;
  mfaRequired: true;
  mfaEnrollmentRequired: boolean;
  mfaTicket: string;
  mfaChallengeType: "totp";
  mfaSetupChallenge: string | null;
  mfaRecoveryCodes: [];
  accessToken: null;
  refreshToken: null;
  sessionExpiresAt: null;
  user: null;
}

type LoginResponse = SuccessfulLoginResponse | PendingMfaLoginResponse;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService,
    private readonly riskThrottleService?: RiskThrottleService,
    private readonly notificationCenterService?: NotificationCenterService
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const loginThrottleKey = this.buildThrottleKey("auth:login", dto.username);
    await this.riskThrottleService?.assertAllowed(loginThrottleKey, LOGIN_THROTTLE);
    const user = await this.authRepository.findUserByUsername(dto.username);
    const isTenantUnavailable = !user?.tenant || user.tenant.status !== RecordStatus.ACTIVE || Boolean(user.tenant.archivedAt);
    const isUserUnavailable = !user || user.status !== UserStatus.ACTIVE;

    if (!user || isUserUnavailable || isTenantUnavailable) {
      await this.riskThrottleService?.recordFailure(loginThrottleKey, LOGIN_THROTTLE);
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
      const nextLockEscalationCount = ((user as AuthUserRecord & { lockEscalationCount?: number }).lockEscalationCount ?? 0) + 1;
      const nextSecurityLockStatus = this.resolveSecurityLockStatus(nextLockEscalationCount);
      if (nextSecurityLockStatus !== "NONE") {
        await this.authRepository.updateUserSecurityState(user.id, user.tenantId, {
          lockedAt: new Date(),
          lockEscalationCount: nextLockEscalationCount,
          securityLockStatus: nextSecurityLockStatus,
          securityLockReason:
            nextSecurityLockStatus === "REVIEW_REQUIRED"
              ? "Repeated failed logins require administrator review."
              : "Repeated failed logins permanently locked this account."
        });
      } else {
        await this.authRepository.updateUserSecurityState(user.id, user.tenantId, {
          lockEscalationCount: nextLockEscalationCount
        });
      }
      await this.riskThrottleService?.recordFailure(loginThrottleKey, LOGIN_THROTTLE);
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

    if (this.isSecurityLocked(user)) {
      throw new UnauthorizedException("User is unavailable.");
    }

    const result = await this.loginWithUser(user, {
      targetType: "auth",
      targetId: user.id,
      detail: {
        loginType: "password"
      }
    });
    await this.riskThrottleService?.recordSuccess(loginThrottleKey);

    return result;
  }

  async loginWithUser(user: AuthUserRecord, auditContext: LoginAuditContext = {}): Promise<LoginResponse> {
    if (!this.isLoginUserAvailable(user)) {
      throw new UnauthorizedException("User is unavailable.");
    }

    const hasConfiguredMfa = this.hasConfiguredMfa(user);
    const policyRequiresMfa = this.isMfaPolicyRequired(user);

    if (hasConfiguredMfa) {
      return this.issuePendingMfaChallenge(user, auditContext, {
        enrollmentRequired: false,
        setupChallenge: null
      });
    }

    if (policyRequiresMfa) {
      const otp = await this.getOtpToolkit();
      const existingPendingSecret = (user as AuthUserRecord & { mfaPendingSecret?: string | null }).mfaPendingSecret;
      const pendingSecret = existingPendingSecret ?? otp.generateSecret();
      if (!existingPendingSecret) {
        await this.authRepository.updateUserSecurityState(user.id, user.tenantId, {
          mfaPendingSecret: pendingSecret
        });
      }

      return this.issuePendingMfaChallenge(user, auditContext, {
        enrollmentRequired: true,
        setupChallenge: otp.generateURI({
          issuer: MFA_ISSUER,
          label: user.username,
          secret: pendingSecret
        })
      });
    }

    return this.issueLoginResponse(user, auditContext);
  }

  async refresh(dto: RefreshSessionInput) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException("Session is invalid.");
    }

    const refreshTokenHash = this.hashRefreshToken(dto.refreshToken);
    const refreshThrottleKey = this.buildThrottleKey("auth:refresh", refreshTokenHash);
    await this.riskThrottleService?.assertAllowed(refreshThrottleKey, REFRESH_THROTTLE);
    const session = await this.authRepository.findSessionByRefreshTokenHash(refreshTokenHash);

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== UserStatus.ACTIVE ||
      session.user.tenant.status !== RecordStatus.ACTIVE ||
      Boolean(session.user.tenant.archivedAt) ||
      session.user.tenantId !== session.tenantId
    ) {
      await this.riskThrottleService?.recordFailure(refreshThrottleKey, REFRESH_THROTTLE);
      await this.auditLogsService.create({
        actionType: AuditActionType.SIGN_IN_FAILED,
        targetType: "auth-session",
        targetId: session?.id,
        detail: {
          reason: !session ? "invalid_refresh_token" : "unavailable_session"
        }
      });
      throw new UnauthorizedException("Session is invalid.");
    }

    const authUser = {
      ...mapAuthUser(session.user),
      sessionId: session.id
    };
    const nextRefreshToken = this.generateRefreshToken();

    await this.authRepository.rotateSessionRefreshToken(session.id, this.hashRefreshToken(nextRefreshToken));
    await this.riskThrottleService?.recordSuccess(refreshThrottleKey);

    return {
      success: true,
      mfaRequired: false,
      mfaEnrollmentRequired: false,
      mfaTicket: null,
      mfaChallengeType: null,
      mfaSetupChallenge: null,
      mfaRecoveryCodes: [],
      accessToken: await this.signAccessToken(authUser),
      refreshToken: nextRefreshToken,
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

  async listMySessions(user: AuthUser) {
    return this.listUserSessions(user.id, user, user.sessionId);
  }

  async listUserSessionsForAdmin(userId: string, actor: AuthUser) {
    // 管理员接口复用租户边界查询，避免跨租户枚举会话元数据。
    await this.authRepository.findUserById(userId, requireTenantId(actor));

    return this.listUserSessions(userId, actor, actor.id === userId ? actor.sessionId : undefined);
  }

  async revokeMySession(sessionId: string, user: AuthUser) {
    if (!user.sessionId) {
      throw new UnauthorizedException("Missing active session.");
    }

    if (sessionId === user.sessionId) {
      throw new BadRequestException("Use logout to revoke the current session.");
    }

    const result = await this.authRepository.revokeSession(sessionId, user.id, requireTenantId(user));
    if (result.count === 0) {
      throw new NotFoundException("Active session was not found.");
    }

    await this.auditLogsService.create({
      tenantId: requireTenantId(user),
      actorId: user.id,
      actorName: user.displayName,
      actionType: AuditActionType.SESSION_REVOKE,
      targetType: "auth-session",
      targetId: sessionId,
      detail: {
        scope: "self"
      }
    });

    return {
      success: true
    };
  }

  async revokeUserSessionForAdmin(userId: string, sessionId: string, actor: AuthUser) {
    const tenantId = requireTenantId(actor);

    await this.authRepository.findUserById(userId, tenantId);
    const session = await this.authRepository.findSessionById(sessionId, tenantId);
    if (!session || session.userId !== userId || session.revokedAt) {
      throw new NotFoundException("Active session was not found.");
    }

    const result = await this.authRepository.revokeSessionByTenant(sessionId, tenantId);
    if (result.count === 0) {
      throw new NotFoundException("Active session was not found.");
    }

    await this.auditLogsService.create({
      tenantId,
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.SESSION_REVOKE,
      targetType: "auth-session",
      targetId: sessionId,
      detail: {
        scope: "admin",
        userId
      }
    });

    return {
      success: true
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const normalizedIdentifier = dto.identifier.trim();
    const user = await this.authRepository.findUserByIdentifier(normalizedIdentifier).catch(() => null);

    if (!user) {
      return {
        success: true
      };
    }

    const token = this.generatePasswordResetToken();
    await this.authRepository.createPasswordResetToken(
      user.id,
      this.hashPasswordResetToken(token),
      new Date(Date.now() + PASSWORD_RESET_TTL_MS)
    );
    await this.auditLogsService.create({
      actorId: user.id,
      actorName: user.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "auth-password-reset",
      targetId: user.id
    });
    await this.notificationCenterService?.publishEvent({
      event: {
        tenantId: user.tenantId,
        eventType: "PASSWORD_RESET_REQUESTED",
        domain: "PLATFORM",
        sourceType: "auth-password-reset",
        sourceId: user.id,
        title: "密码重置请求",
        summary: "系统已收到密码重置请求，请在有效期内完成重置。",
        priority: "HIGH",
        requiredChannels: ["EMAIL"],
        payload: {
          resetToken: token,
          resetUrl: this.buildPasswordResetUrl(token),
          actionLabel: "重置密码"
        },
        targetPath: `/auth/password-reset?token=${encodeURIComponent(token)}`,
        targetLabel: "重置密码",
        actorId: user.id,
        occurredAt: new Date()
      },
      recipientIds: [user.id]
    });

    return {
      success: true
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    assertStrongPassword(dto.password);
    const tokenHash = this.hashPasswordResetToken(dto.token.trim());
    const tokenRecord = await this.authRepository.findPasswordResetToken(tokenHash);
    const candidateUser = tokenRecord?.user;

    if (
      !tokenRecord ||
      tokenRecord.usedAt ||
      tokenRecord.expiresAt <= new Date() ||
      !candidateUser
    ) {
      throw new UnauthorizedException("Password reset token is invalid.");
    }

    await this.assertPasswordHistory(candidateUser.id, candidateUser.passwordHash, dto.password);
    await this.authRepository.updateUserSecurityState(candidateUser.id, candidateUser.tenantId, {
      passwordHash: await bcrypt.hash(dto.password, 10),
      lockedAt: null,
      lockEscalationCount: 0,
      securityLockStatus: "NONE",
      securityLockReason: null,
      securityLockReviewedAt: new Date(),
      securityLockReviewedById: candidateUser.id
    });
    await this.authRepository.createPasswordHistory(candidateUser.id, candidateUser.passwordHash);
    await this.authRepository.markPasswordResetTokenUsed(tokenRecord.id);
    await this.auditLogsService.create({
      actorId: candidateUser.id,
      actorName: candidateUser.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "auth-password-reset",
      targetId: candidateUser.id
    });

    return {
      success: true
    };
  }

  async configureMfa(user: AuthUser, dto: ConfigureMfaDto) {
    const tenantId = requireTenantId(user);
    const record = await this.authRepository.findUserById(user.id, tenantId);
    const otp = await this.getOtpToolkit();
    const requestedAction = dto.action?.trim() || "setup";
    const enabled = Boolean((record as AuthUserRecord & { mfaEnabled?: boolean }).mfaEnabled);
    const activeSecret = (record as AuthUserRecord & { mfaSecret?: string | null }).mfaSecret;
    const pendingSecret = (record as AuthUserRecord & { mfaPendingSecret?: string | null }).mfaPendingSecret;

    if (requestedAction === "disable") {
      if (!enabled || !activeSecret) {
        throw new BadRequestException("MFA is not enabled.");
      }

      const verified = await this.verifyMfaMaterial(record, dto.code?.trim() ?? dto.recoveryCode?.trim());
      if (!verified) {
        throw new UnauthorizedException("MFA code is invalid.");
      }

      await this.authRepository.updateUserSecurityState(record.id, tenantId, {
        mfaEnabled: false,
        mfaSecret: null,
        mfaPendingSecret: null,
        mfaConfiguredAt: null
      });
      await this.authRepository.replaceMfaRecoveryCodes(record.id, []);
      await this.auditLogsService.create({
        tenantId,
        actorId: user.id,
        actorName: user.displayName,
        actionType: AuditActionType.UPDATE,
        targetType: "auth-mfa",
        targetId: record.id,
        detail: {
          action: "disable"
        }
      });

      return {
        enabled: false,
        pending: false,
        challenge: null,
        recoveryCodes: []
      };
    }

    if (requestedAction === "rotate-recovery") {
      if (!enabled || !activeSecret) {
        throw new BadRequestException("MFA is not enabled.");
      }

      const verified = await this.verifyMfaMaterial(record, dto.code?.trim() ?? dto.recoveryCode?.trim());
      if (!verified) {
        throw new UnauthorizedException("MFA code is invalid.");
      }

      const rotatedRecoveryCodes = await this.replaceRecoveryCodes(record.id);
      await this.auditLogsService.create({
        tenantId,
        actorId: user.id,
        actorName: user.displayName,
        actionType: AuditActionType.UPDATE,
        targetType: "auth-mfa",
        targetId: record.id,
        detail: {
          action: "rotate-recovery"
        }
      });

      return {
        enabled: true,
        pending: false,
        challenge: null,
        recoveryCodes: rotatedRecoveryCodes
      };
    }

    const secret = pendingSecret ?? otp.generateSecret();

    if (!dto.code) {
      await this.authRepository.updateUserSecurityState(record.id, tenantId, {
        mfaPendingSecret: secret
      });

      return {
        enabled,
        pending: true,
        challenge: otp.generateURI({
          issuer: MFA_ISSUER,
          label: record.username,
          secret
        }),
        recoveryCodes: []
      };
    }

    const verifyResult = otp.verifySync({
      secret,
      token: dto.code.trim()
    });
    if (!verifyResult.valid) {
      throw new UnauthorizedException("MFA code is invalid.");
    }

    const recoveryCodes = await this.replaceRecoveryCodes(record.id);
    await this.authRepository.updateUserSecurityState(record.id, tenantId, {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaPendingSecret: null,
      mfaConfiguredAt: new Date()
    });
    await this.auditLogsService.create({
      tenantId,
      actorId: user.id,
      actorName: user.displayName,
      actionType: AuditActionType.MFA_CONFIGURED,
      targetType: "auth-mfa",
      targetId: record.id,
      detail: {
        action: enabled ? "reconfigure" : "enable"
      }
    });

    return {
      enabled: true,
      pending: false,
      challenge: null,
      recoveryCodes
    };
  }

  async verifyMfa(user: AuthUser, dto: VerifyMfaDto) {
    const tenantId = requireTenantId(user);
    const record = await this.authRepository.findUserById(user.id, tenantId);
    const verified = await this.verifyMfaMaterial(record, dto.code.trim());
    if (!verified) {
      throw new UnauthorizedException("MFA code is invalid.");
    }

    return {
      success: true
    };
  }

  async verifyLoginMfa(dto: VerifyLoginMfaDto): Promise<SuccessfulLoginResponse> {
    const challenge = await this.authRepository.findMfaChallenge(this.hashPasswordResetToken(dto.ticket.trim()));

    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt <= new Date() ||
      !this.isLoginUserAvailable(challenge.user)
    ) {
      throw new UnauthorizedException("MFA challenge is invalid.");
    }

    let recoveryCodes: string[] = [];
    if (this.hasConfiguredMfa(challenge.user)) {
      const verified = await this.verifyMfaMaterial(challenge.user, dto.code.trim());
      if (!verified) {
        throw new UnauthorizedException("MFA code is invalid.");
      }
    } else {
      const pendingSecret = (challenge.user as AuthUserRecord & { mfaPendingSecret?: string | null }).mfaPendingSecret;
      if (!pendingSecret) {
        throw new UnauthorizedException("MFA enrollment is not prepared.");
      }

      const otp = await this.getOtpToolkit();
      const verifyResult = otp.verifySync({
        secret: pendingSecret,
        token: dto.code.trim()
      });
      if (!verifyResult.valid) {
        throw new UnauthorizedException("MFA code is invalid.");
      }

      recoveryCodes = await this.replaceRecoveryCodes(challenge.user.id);
      await this.authRepository.updateUserSecurityState(challenge.user.id, challenge.tenantId, {
        mfaEnabled: true,
        mfaSecret: pendingSecret,
        mfaPendingSecret: null,
        mfaConfiguredAt: new Date()
      });
      await this.auditLogsService.create({
        tenantId: challenge.tenantId,
        actorId: challenge.user.id,
        actorName: challenge.user.displayName,
        actionType: AuditActionType.MFA_CONFIGURED,
        targetType: "auth-mfa",
        targetId: challenge.user.id,
        detail: {
          action: "enforce-enrollment"
        }
      });
    }

    await this.authRepository.consumeMfaChallenge(challenge.id);
    await this.auditLogsService.create({
      tenantId: challenge.tenantId,
      actorId: challenge.user.id,
      actorName: challenge.user.displayName,
      actionType: AuditActionType.MFA_VERIFIED,
      targetType: "auth-mfa-challenge",
      targetId: challenge.id
    });

    const result = await this.issueLoginResponse(challenge.user, {
      targetType: "auth-mfa-challenge",
      targetId: challenge.id,
      detail: {
        loginType: "mfa-complete"
      },
      recoveryCodes
    });

    if (!result.success) {
      throw new UnauthorizedException("MFA challenge did not produce an active session.");
    }

    return result;
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
      Boolean(user.tenant.archivedAt) ||
      this.isSecurityLocked(user)
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
    const refreshToken = this.generateRefreshToken();
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

  // 两阶段 MFA 需要把“待确认 secret”和“登录 challenge ticket”分开存储：
  // 前者避免二维码展示和确认码验证使用不同 secret，后者避免在未完成二次验证前直接签发会话。
  private async issuePendingMfaChallenge(
    user: AuthUserRecord,
    auditContext: LoginAuditContext,
    options: {
      enrollmentRequired: boolean;
      setupChallenge: string | null;
    }
  ): Promise<PendingMfaLoginResponse> {
    const ticket = this.generatePasswordResetToken();
    const challenge = await this.authRepository.createMfaChallenge(
      user.id,
      user.tenantId,
      this.hashPasswordResetToken(ticket),
      new Date(Date.now() + MFA_LOGIN_CHALLENGE_TTL_MS)
    );

    await this.auditLogsService.create({
      tenantId: user.tenantId,
      actorId: user.id,
      actorName: user.displayName,
      actionType: AuditActionType.MFA_CHALLENGE,
      targetType: auditContext.targetType ?? "auth",
      targetId: auditContext.targetId ?? challenge.id,
      detail: {
        ...(auditContext.detail ?? {}),
        challengeId: challenge.id
      } as Prisma.InputJsonObject
    });

    return {
      success: false,
      mfaRequired: true,
      mfaEnrollmentRequired: options.enrollmentRequired,
      mfaTicket: ticket,
      mfaChallengeType: "totp",
      mfaSetupChallenge: options.setupChallenge,
      mfaRecoveryCodes: [],
      accessToken: null,
      refreshToken: null,
      sessionExpiresAt: null,
      user: null
    };
  }

  private async replaceRecoveryCodes(userId: string) {
    const recoveryCodes = Array.from({ length: MFA_RECOVERY_CODE_COUNT }, () =>
      this.generatePasswordResetToken().slice(0, MFA_RECOVERY_CODE_LENGTH)
    );
    await this.authRepository.replaceMfaRecoveryCodes(userId, recoveryCodes.map((item) => this.hashPasswordResetToken(item)));
    return recoveryCodes;
  }

  private async verifyMfaMaterial(record: AuthUserRecord, code: string | undefined): Promise<boolean> {
    const normalizedCode = code?.trim();
    const secret = (record as AuthUserRecord & { mfaSecret?: string | null }).mfaSecret;

    if (!normalizedCode || !secret) {
      throw new UnauthorizedException("MFA is not configured.");
    }

    const otp = await this.getOtpToolkit();
    const verifyResult = otp.verifySync({
      secret,
      token: normalizedCode
    });
    if (verifyResult.valid) {
      return true;
    }

    const recoveryCode = await this.authRepository.findMfaRecoveryCode(record.id, this.hashPasswordResetToken(normalizedCode));
    if (!recoveryCode) {
      return false;
    }

    await this.authRepository.markMfaRecoveryCodeUsed(recoveryCode.id);
    await this.auditLogsService.create({
      tenantId: record.tenantId,
      actorId: record.id,
      actorName: record.displayName,
      actionType: AuditActionType.MFA_RECOVERY_USED,
      targetType: "auth-mfa-recovery",
      targetId: recoveryCode.id
    });

    return true;
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  private hashPasswordResetToken(value: string): string {
    return createHmac("sha256", "auth-reset-token-pepper").update(value).digest("hex");
  }

  private generateRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
  }

  private generatePasswordResetToken(): string {
    return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex");
  }

  private buildPasswordResetUrl(token: string): string | null {
    const baseUrl = process.env.PASSWORD_RESET_PUBLIC_BASE_URL?.trim();
    if (!baseUrl) {
      return null;
    }

    return new URL(`/auth/password-reset?token=${encodeURIComponent(token)}`, baseUrl).toString();
  }

  private buildThrottleKey(scope: string, value: string): string {
    return `${scope}:${value.trim().toLowerCase()}`;
  }

  private signAccessToken(payload: AuthUser) {
    return this.jwtService.signAsync(payload);
  }

  private async listUserSessions(userId: string, actor: AuthUser, currentSessionId?: string): Promise<SessionListItem[]> {
    const sessions = await this.authRepository.listUserSessions(userId, requireTenantId(actor));

    return sessions.map((session) => this.mapSessionListItem(session, currentSessionId));
  }

  private mapSessionListItem(session: AuthSessionListRecord, currentSessionId?: string): SessionListItem {
    const isActive = !session.revokedAt && session.expiresAt > new Date();

    return {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: session.revokedAt?.toISOString() ?? null,
      lastSeenAt: session.lastSeenAt?.toISOString() ?? null,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      isCurrent: session.id === currentSessionId,
      isActive
    };
  }

  private isLoginUserAvailable(user: AuthUserRecord): boolean {
    return (
      user.status === UserStatus.ACTIVE &&
      Boolean(user.tenant) &&
      user.tenant.status === RecordStatus.ACTIVE &&
      !user.tenant.archivedAt
    );
  }

  private async issueLoginResponse(
    user: AuthUserRecord,
    auditContext: LoginAuditContext & {
      recoveryCodes?: string[];
    } = {}
  ): Promise<SuccessfulLoginResponse> {
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
      success: true,
      mfaRequired: false,
      mfaEnrollmentRequired: false,
      mfaTicket: null,
      mfaChallengeType: null,
      mfaSetupChallenge: null,
      mfaRecoveryCodes: auditContext.recoveryCodes ?? [],
      accessToken: await this.signAccessToken({
        ...authUser,
        sessionId: session.id
      }),
      refreshToken: session.refreshToken,
      sessionExpiresAt: session.expiresAt.toISOString(),
      user: authUser
    };
  }

  private isMfaPolicyRequired(user: AuthUserRecord): boolean {
    const hasSensitiveRole = user.roles.some((item) => MFA_REQUIRED_ROLE_CODES.has(item.role.code));
    const hasSensitivePermission = user.roles.some((item) =>
      item.role.permissions.some((permission) => MFA_REQUIRED_PERMISSIONS.has(permission.permission.code))
    );
    return hasSensitiveRole || hasSensitivePermission;
  }

  private hasConfiguredMfa(user: AuthUserRecord): boolean {
    return Boolean((user as AuthUserRecord & { mfaEnabled?: boolean; mfaSecret?: string | null }).mfaEnabled) &&
      Boolean((user as AuthUserRecord & { mfaSecret?: string | null }).mfaSecret);
  }

  private resolveSecurityLockStatus(lockEscalationCount: number) {
    if (lockEscalationCount >= PASSWORD_LOCK_THRESHOLD) {
      return "LOCKED";
    }

    if (lockEscalationCount >= PASSWORD_LOCK_THRESHOLD - 2) {
      return "REVIEW_REQUIRED";
    }

    return "NONE";
  }

  private isSecurityLocked(user: AuthUserRecord) {
    const securityLockStatus = (user as AuthUserRecord & { securityLockStatus?: SecurityLockStatus }).securityLockStatus;
    return securityLockStatus === "REVIEW_REQUIRED" || securityLockStatus === "LOCKED";
  }

  private async assertPasswordHistory(userId: string, currentPasswordHash: string, nextPassword: string) {
    const reusedCurrentPassword = await bcrypt.compare(nextPassword, currentPasswordHash);

    if (reusedCurrentPassword) {
      throw new BadRequestException("Password must not match a recently used password.");
    }

    const history = await this.authRepository.listPasswordHistory(userId, PASSWORD_HISTORY_LIMIT);

    for (const item of history) {
      if (await bcrypt.compare(nextPassword, item.passwordHash)) {
        throw new BadRequestException("Password must not match a recently used password.");
      }
    }
  }

  private async getOtpToolkit() {
    return import("otplib");
  }
}
