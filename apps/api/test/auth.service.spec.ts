import { createHash } from "crypto";

import bcrypt from "bcryptjs";
import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";

import { AuthService } from "../src/modules/auth/auth.service";
import { RiskThrottleService } from "../src/common/security/risk-throttle.service";
function buildAuthUserRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    tenantId: "tenant-default",
    username: "admin",
    displayName: "系统管理员",
    departmentId: "dept-1",
    status: "ACTIVE",
    lockEscalationCount: 0,
    passwordHash: "hashed-password",
    tenant: {
      code: "default",
      status: "ACTIVE",
      archivedAt: null
    },
    roles: [
      {
        role: {
          code: "super-admin",
          dataScope: "ALL",
          extendedDataScopes: [
            {
              dimension: "REGION",
              values: ["华东一区"],
              note: "区域覆盖"
            }
          ],
          fieldPermissionRules: [
            {
              resource: "customer",
              field: "phone",
              visibility: "MASKED"
            }
          ],
          actionPermissionRules: [
            {
              resource: "revenue",
              action: "confirm-payment",
              allowed: false
            }
          ],
          permissions: [
            { permission: { code: "dashboard:view" } },
            { permission: { code: "customer:read" } }
          ]
        }
      }
    ],
    ...overrides
  } as any;
}

describe("AuthService", () => {
  const activeSession = {
    id: "session-1",
    tenantId: "tenant-default",
    userId: "user-1",
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    lastSeenAt: new Date("2026-05-01T08:00:00.000Z"),
    ipAddress: "127.0.0.1",
    userAgent: "vitest-agent",
    createdAt: new Date("2026-05-01T07:00:00.000Z"),
    updatedAt: new Date("2026-05-01T08:00:00.000Z")
  };

  it("returns token, refresh token and flattened permissions after successful login", async () => {
    const passwordHash = await bcrypt.hash("Admin123456!Aa", 10);
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(
        buildAuthUserRecord({
          passwordHash,
          roles: [
            {
              role: {
                code: "sales-member",
                dataScope: "ALL",
                extendedDataScopes: [
                  {
                    dimension: "REGION",
                    values: ["华东一区"],
                    note: "区域覆盖"
                  }
                ],
                fieldPermissionRules: [
                  {
                    resource: "customer",
                    field: "phone",
                    visibility: "MASKED"
                  }
                ],
                actionPermissionRules: [
                  {
                    resource: "revenue",
                    action: "confirm-payment",
                    allowed: false
                  }
                ],
                permissions: [{ permission: { code: "dashboard:view" } }, { permission: { code: "customer:read" } }]
              }
            }
          ]
        })
      ),
      createUserSession: vi.fn().mockResolvedValue({
        id: "session-1"
      })
    } as any;
    const jwtService = {
      signAsync: vi.fn().mockResolvedValue("token-123")
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(authRepository, jwtService, auditLogsService);
    const result = await service.login({
      username: "admin",
      password: "Admin123456!Aa"
    });
    if (!result.success) {
      throw new Error("expected a successful login response");
    }

    expect(authRepository.findUserByUsername).toHaveBeenCalledWith("admin");
    expect(authRepository.createUserSession).toHaveBeenCalledWith(
      "user-1",
      "tenant-default",
      expect.any(String),
      expect.any(Date)
    );
    expect(result.accessToken).toBe("token-123");
    expect(result.refreshToken).toBeTruthy();
    expect(result.user.permissions).toEqual(["dashboard:view", "customer:read"]);
    expect(result.user.dataScopes).toEqual(["ALL"]);
    expect(result.user.extendedDataScopes).toEqual([
      {
        dimension: "REGION",
        values: ["华东一区"],
        note: "区域覆盖"
      }
    ]);
    expect(result.user.fieldPermissionRules).toEqual([
      {
        resource: "customer",
        field: "phone",
        visibility: "MASKED"
      }
    ]);
    expect(result.user.actionPermissionRules).toEqual([
      {
        resource: "revenue",
        action: "confirm-payment",
        allowed: false
      }
    ]);
    expect(auditLogsService.create).toHaveBeenCalledTimes(1);
  });

  it("returns an mfa challenge instead of issuing a session for privileged users", async () => {
    const passwordHash = await bcrypt.hash("Admin123456!Aa", 10);
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(buildAuthUserRecord({ passwordHash, mfaEnabled: true, mfaSecret: "otp-secret" })),
      createMfaChallenge: vi.fn().mockResolvedValue({
        id: "challenge-1",
        tenantId: "tenant-default",
        user: buildAuthUserRecord({ passwordHash, mfaEnabled: true, mfaSecret: "otp-secret" })
      }),
      createUserSession: vi.fn()
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    const result = await service.login({
      username: "admin",
      password: "Admin123456!Aa"
    });

    expect(result).toMatchObject({
      success: false,
      mfaRequired: true,
      mfaEnrollmentRequired: false,
      mfaChallengeType: "totp",
      sessionExpiresAt: null,
      user: null
    });
    expect(result.mfaTicket).toEqual(expect.any(String));
    expect(authRepository.createUserSession).not.toHaveBeenCalled();
  });

  it("refreshes an active session", async () => {
    const authRepository = {
      findSessionByRefreshTokenHash: vi.fn().mockResolvedValue({
        id: "session-1",
        tenantId: "tenant-default",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        user: buildAuthUserRecord()
      }),
      rotateSessionRefreshToken: vi.fn().mockResolvedValue(undefined)
    } as any;
    const jwtService = {
      signAsync: vi.fn().mockResolvedValue("token-456")
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(authRepository, jwtService, auditLogsService);
    const refreshToken = "a".repeat(96);
    const expectedHash = createHash("sha256").update(refreshToken).digest("hex");

    const result = await service.refresh({
      refreshToken
    });

    expect(authRepository.findSessionByRefreshTokenHash).toHaveBeenCalledWith(expectedHash);
    expect(authRepository.rotateSessionRefreshToken).toHaveBeenCalledWith("session-1", expect.any(String));
    expect(result.accessToken).toBe("token-456");
    expect(result.refreshToken).toBeTruthy();
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(result.user.roleCodes).toEqual(["super-admin"]);
  });

  it("rejects replayed refresh tokens after rotation", async () => {
    const refreshToken = "a".repeat(96);
    const rotatedTokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const authRepository = {
      findSessionByRefreshTokenHash: vi
        .fn()
        .mockResolvedValueOnce({
          id: "session-1",
          tenantId: "tenant-default",
          userId: "user-1",
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: null,
          user: buildAuthUserRecord()
        })
        .mockResolvedValueOnce(null),
      rotateSessionRefreshToken: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn().mockResolvedValue("token-456")
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    await service.refresh({ refreshToken });
    await expect(service.refresh({ refreshToken })).rejects.toBeInstanceOf(UnauthorizedException);

    expect(authRepository.findSessionByRefreshTokenHash).toHaveBeenCalledWith(rotatedTokenHash);
    expect(authRepository.rotateSessionRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("rejects revoked sessions during payload validation", async () => {
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(buildAuthUserRecord()),
      findSessionById: vi.fn().mockResolvedValue({
        id: "session-1",
        tenantId: "tenant-default",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date()
      })
    } as any;

    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn().mockResolvedValue("token-123")
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    await expect(
      service.validateSessionPayload({
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "admin",
        displayName: "系统管理员",
        departmentId: "dept-1",
        roleCodes: ["super-admin"],
        permissions: ["dashboard:view"],
        dataScopes: ["ALL"],
        sessionId: "session-1"
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("revokes the current session during logout", async () => {
    const authRepository = {
      revokeSession: vi.fn().mockResolvedValue({ count: 1 })
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn().mockResolvedValue("token-123")
      } as any,
      auditLogsService
    );
    const result = await service.logout({
      id: "user-1",
      tenantId: "tenant-default",
      tenantCode: "default",
      username: "admin",
      displayName: "系统管理员",
      departmentId: "dept-1",
      roleCodes: ["super-admin"],
      permissions: ["dashboard:view"],
      dataScopes: ["ALL"],
      sessionId: "session-1"
    });

    expect(authRepository.revokeSession).toHaveBeenCalledWith("session-1", "user-1", "tenant-default");
    expect(auditLogsService.create).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("lists current-user sessions without exposing stored token hashes", async () => {
    const authRepository = {
      listUserSessions: vi.fn().mockResolvedValue([activeSession])
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    const result = await service.listMySessions({
      id: "user-1",
      tenantId: "tenant-default",
      tenantCode: "default",
      username: "admin",
      displayName: "系统管理员",
      departmentId: "dept-1",
      roleCodes: ["super-admin"],
      permissions: ["dashboard:view"],
      dataScopes: ["ALL"],
      sessionId: "session-1"
    });

    expect(authRepository.listUserSessions).toHaveBeenCalledWith("user-1", "tenant-default");
    expect(result).toEqual([
      expect.objectContaining({
        id: "session-1",
        userId: "user-1",
        isCurrent: true,
        isActive: true,
        expiresAt: expect.any(String)
      })
    ]);
    expect(result[0]).not.toHaveProperty("refreshTokenHash");
  });

  it("rejects self revocation of the current session", async () => {
    const service = new AuthService(
      {
        revokeSession: vi.fn()
      } as any,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    await expect(
      service.revokeMySession("session-1", {
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "admin",
        displayName: "系统管理员",
        departmentId: "dept-1",
        roleCodes: ["super-admin"],
        permissions: ["dashboard:view"],
        dataScopes: ["ALL"],
        sessionId: "session-1"
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("revokes another session owned by the current user", async () => {
    const authRepository = {
      revokeSession: vi.fn().mockResolvedValue({ count: 1 })
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      auditLogsService
    );

    const result = await service.revokeMySession("session-2", {
      id: "user-1",
      tenantId: "tenant-default",
      tenantCode: "default",
      username: "admin",
      displayName: "系统管理员",
      departmentId: "dept-1",
      roleCodes: ["super-admin"],
      permissions: ["dashboard:view"],
      dataScopes: ["ALL"],
      sessionId: "session-1"
    });

    expect(authRepository.revokeSession).toHaveBeenCalledWith("session-2", "user-1", "tenant-default");
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-default",
        targetId: "session-2",
        detail: expect.objectContaining({
          scope: "self"
        })
      })
    );
    expect(result).toEqual({ success: true });
  });

  it("returns not found when another current-user session is not active", async () => {
    const service = new AuthService(
      {
        revokeSession: vi.fn().mockResolvedValue({ count: 0 })
      } as any,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    await expect(
      service.revokeMySession("session-2", {
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "admin",
        displayName: "系统管理员",
        departmentId: "dept-1",
        roleCodes: ["super-admin"],
        permissions: ["dashboard:view"],
        dataScopes: ["ALL"],
        sessionId: "session-1"
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lets an admin list and revoke a tenant user session", async () => {
    const authRepository = {
      findUserById: vi.fn().mockResolvedValue(buildAuthUserRecord({ id: "user-2" })),
      listUserSessions: vi.fn().mockResolvedValue([
        {
          ...activeSession,
          id: "session-2",
          userId: "user-2"
        }
      ]),
      findSessionById: vi.fn().mockResolvedValue({
        id: "session-2",
        tenantId: "tenant-default",
        userId: "user-2",
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null
      }),
      revokeSessionByTenant: vi.fn().mockResolvedValue({ count: 1 })
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      auditLogsService
    );
    const admin = {
      id: "admin-1",
      tenantId: "tenant-default",
      tenantCode: "default",
      username: "admin",
      displayName: "系统管理员",
      departmentId: "dept-1",
      roleCodes: ["super-admin"],
      permissions: ["user:write"],
      dataScopes: ["ALL"],
      sessionId: "admin-session"
    } as any;

    const sessions = await service.listUserSessionsForAdmin("user-2", admin);
    const revokeResult = await service.revokeUserSessionForAdmin("user-2", "session-2", admin);

    expect(authRepository.findUserById).toHaveBeenCalledWith("user-2", "tenant-default");
    expect(authRepository.listUserSessions).toHaveBeenCalledWith("user-2", "tenant-default");
    expect(sessions[0]).toEqual(
      expect.objectContaining({
        id: "session-2",
        userId: "user-2",
        isCurrent: false
      })
    );
    expect(authRepository.revokeSessionByTenant).toHaveBeenCalledWith("session-2", "tenant-default");
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-default",
        targetId: "session-2",
        detail: expect.objectContaining({
          scope: "admin",
          userId: "user-2"
        })
      })
    );
    expect(revokeResult).toEqual({ success: true });
  });

  it("rejects admin revocation when the session does not belong to the target user", async () => {
    const service = new AuthService(
      {
        findUserById: vi.fn().mockResolvedValue(buildAuthUserRecord({ id: "user-2" })),
        findSessionById: vi.fn().mockResolvedValue({
          id: "session-2",
          tenantId: "tenant-default",
          userId: "other-user",
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: null
        }),
        revokeSessionByTenant: vi.fn()
      } as any,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    await expect(
      service.revokeUserSessionForAdmin(
        "user-2",
        "session-2",
        {
          id: "admin-1",
          tenantId: "tenant-default",
          tenantCode: "default",
          username: "admin",
          displayName: "系统管理员",
          departmentId: "dept-1",
          roleCodes: ["super-admin"],
          permissions: ["user:write"],
          dataScopes: ["ALL"],
          sessionId: "admin-session"
        } as any
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects disabled users during payload validation", async () => {
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(buildAuthUserRecord({ status: "DISABLED", roles: [] })),
      findSessionById: vi.fn().mockResolvedValue({
        id: "session-1",
        tenantId: "tenant-default",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null
      })
    } as any;

    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn().mockResolvedValue("token-123")
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    await expect(
      service.validateSessionPayload({
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "admin",
        displayName: "系统管理员",
        departmentId: "dept-1",
        roleCodes: ["super-admin"],
        permissions: ["dashboard:view"],
        dataScopes: ["ALL"],
        sessionId: "session-1"
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects login when the tenant has been disabled", async () => {
    const passwordHash = await bcrypt.hash("Admin123456!Aa", 10);
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(
        buildAuthUserRecord({
          passwordHash,
          tenant: {
            code: "default",
            status: "DISABLED",
            archivedAt: null
          }
        })
      )
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      auditLogsService
    );

    await expect(
      service.login({
        username: "admin",
        password: "Admin123456!Aa"
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "SIGN_IN_FAILED",
        detail: expect.objectContaining({
          reason: "inactive_tenant"
        })
      })
    );
  });

  it("throttles repeated invalid password attempts", async () => {
    const passwordHash = await bcrypt.hash("Admin123456!Aa", 4);
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(buildAuthUserRecord({ passwordHash, lockEscalationCount: 0 })),
      updateUserSecurityState: vi.fn().mockResolvedValue(undefined)
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      auditLogsService,
      new RiskThrottleService()
    );

    for (let index = 0; index < 5; index += 1) {
      await expect(
        service.login({
          username: "admin",
          password: "WrongPassword!9"
        })
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }

    await expect(
      service.login({
        username: "admin",
        password: "WrongPassword!9"
      })
    ).rejects.toThrow("失败次数过多，请稍后再试。");
  });

  it("throttles repeated invalid refresh token attempts", async () => {
    const authRepository = {
      findSessionByRefreshTokenHash: vi.fn().mockResolvedValue(null)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      new RiskThrottleService()
    );
    const refreshToken = "b".repeat(96);

    for (let index = 0; index < 10; index += 1) {
      await expect(service.refresh({ refreshToken })).rejects.toBeInstanceOf(UnauthorizedException);
    }

    await expect(service.refresh({ refreshToken })).rejects.toThrow("失败次数过多，请稍后再试。");
  });

  it("issues and consumes password reset tokens", async () => {
    const notificationCenterService = {
      publishEvent: vi.fn().mockResolvedValue({ event: {}, notifications: [] })
    } as any;
    const authRepository = {
      findUserByIdentifier: vi.fn().mockResolvedValue(buildAuthUserRecord()),
      createPasswordResetToken: vi.fn().mockResolvedValue(undefined),
      findPasswordResetToken: vi.fn().mockResolvedValue({
        id: "reset-1",
        tokenHash: "hashed",
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        user: buildAuthUserRecord()
      }),
      listPasswordHistory: vi.fn().mockResolvedValue([]),
      createPasswordHistory: vi.fn().mockResolvedValue(undefined),
      updateUserSecurityState: vi.fn().mockResolvedValue(undefined),
      markPasswordResetTokenUsed: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      undefined,
      notificationCenterService
    );

    const request = await service.requestPasswordReset({ identifier: "admin" });
    expect(request).toEqual({ success: true });
    expect(authRepository.findUserByIdentifier).toHaveBeenCalledWith("admin");
    expect(notificationCenterService.publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          eventType: "PASSWORD_RESET_REQUESTED",
          payload: expect.objectContaining({
            resetToken: expect.any(String)
          })
        }),
        recipientIds: ["user-1"]
      })
    );
    const issuedResetToken = notificationCenterService.publishEvent.mock.calls[0][0].event.payload.resetToken;

    await service.resetPassword({
      token: issuedResetToken,
      password: "Password123!A"
    });

    expect(authRepository.createPasswordResetToken).toHaveBeenCalled();
    expect(authRepository.markPasswordResetTokenUsed).toHaveBeenCalledWith("reset-1");
  });

  it("rejects password reuse during reset", async () => {
    const passwordHash = await bcrypt.hash("Password123!A", 4);
    const authRepository = {
      findPasswordResetToken: vi.fn().mockResolvedValue({
        id: "reset-1",
        tokenHash: "hashed",
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        user: buildAuthUserRecord({ passwordHash })
      })
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      undefined,
      {
        publishEvent: vi.fn().mockResolvedValue({ event: {}, notifications: [] })
      } as any
    );

    await expect(
      service.resetPassword({
        token: "reset-token",
        password: "Password123!A"
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects password reuse from recent password history during reset", async () => {
    const currentPasswordHash = await bcrypt.hash("CurrentPassword1!", 4);
    const reusedHistoryHash = await bcrypt.hash("OldPassword123!A!A", 4);
    const authRepository = {
      findPasswordResetToken: vi.fn().mockResolvedValue({
        id: "reset-1",
        tokenHash: "hashed",
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        user: buildAuthUserRecord({ id: "user-9", passwordHash: currentPasswordHash })
      }),
      listPasswordHistory: vi.fn().mockResolvedValue([
        {
          passwordHash: reusedHistoryHash
        }
      ])
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      undefined,
      {
        publishEvent: vi.fn().mockResolvedValue({ event: {}, notifications: [] })
      } as any
    );

    await expect(
      service.resetPassword({
        token: "reset-token",
        password: "OldPassword123!A!A"
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("accepts verified email identifiers when requesting a password reset", async () => {
    const notificationCenterService = {
      publishEvent: vi.fn().mockResolvedValue({ event: {}, notifications: [] })
    } as any;
    const authRepository = {
      findUserByIdentifier: vi.fn().mockResolvedValue(buildAuthUserRecord({ email: "admin@example.com" })),
      createPasswordResetToken: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      undefined,
      notificationCenterService
    );

    const result = await service.requestPasswordReset({ identifier: "admin@example.com" });

    expect(result).toEqual({ success: true });
    expect(authRepository.findUserByIdentifier).toHaveBeenCalledWith("admin@example.com");
    expect(notificationCenterService.publishEvent).toHaveBeenCalled();
  });

  it("rejects weak passwords during reset with the stronger password policy", async () => {
    const authRepository = {
      findPasswordResetToken: vi.fn().mockResolvedValue({
        id: "reset-weak-1",
        tokenHash: "hashed",
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        user: buildAuthUserRecord({ id: "user-weak-1", passwordHash: await bcrypt.hash("CurrentPassword1!", 4) })
      })
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      undefined,
      {
        publishEvent: vi.fn().mockResolvedValue({ event: {}, notifications: [] })
      } as any
    );

    await expect(
      service.resetPassword({
        token: "reset-token",
        password: "Password123"
      })
    ).rejects.toThrow("密码复杂度不符合要求");
  });

  it("permanently locks the account after repeated lock windows", async () => {
    const passwordHash = await bcrypt.hash("Admin123456!Aa", 4);
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(buildAuthUserRecord({ passwordHash, lockEscalationCount: 9 })),
      updateUserSecurityState: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      new RiskThrottleService()
    );

    for (let index = 0; index < 5; index += 1) {
      await expect(
        service.login({
          username: "admin",
          password: "WrongPassword!9"
        })
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }

    await expect(
      service.login({
        username: "admin",
        password: "WrongPassword!9"
      })
    ).rejects.toThrow("失败次数过多，请稍后再试。");

    expect(authRepository.updateUserSecurityState).toHaveBeenCalledWith(
      "user-1",
      "tenant-default",
      expect.objectContaining({
        lockedAt: expect.any(Date),
        securityLockStatus: "LOCKED"
      })
    );
  });

  it("marks the account as review-required before the permanent lock threshold", async () => {
    const passwordHash = await bcrypt.hash("Admin123456!Aa", 4);
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(buildAuthUserRecord({ passwordHash, lockEscalationCount: 7 })),
      updateUserSecurityState: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      new RiskThrottleService()
    );

    await expect(
      service.login({
        username: "admin",
        password: "WrongPassword!9"
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(authRepository.updateUserSecurityState).toHaveBeenCalledWith(
      "user-1",
      "tenant-default",
      expect.objectContaining({
        securityLockStatus: "REVIEW_REQUIRED",
        lockedAt: expect.any(Date)
      })
    );
  });

  it("rejects login when the account is pending admin security review", async () => {
    const passwordHash = await bcrypt.hash("Admin123456!Aa", 4);
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(
        buildAuthUserRecord({
          passwordHash,
          securityLockStatus: "REVIEW_REQUIRED",
          lockedAt: new Date("2026-05-03T00:00:00.000Z")
        })
      )
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    await expect(
      service.login({
        username: "admin",
        password: "Admin123456!Aa"
      })
    ).rejects.toThrow("当前账号不可用，请联系管理员。");
  });

  it("rejects session payload validation when the account is permanently locked", async () => {
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(
        buildAuthUserRecord({
          securityLockStatus: "LOCKED",
          lockedAt: new Date("2026-05-03T00:00:00.000Z")
        })
      ),
      findSessionById: vi.fn().mockResolvedValue({
        id: "session-1",
        tenantId: "tenant-default",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null
      })
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn().mockResolvedValue("token-123")
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    await expect(
      service.validateSessionPayload({
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "admin",
        displayName: "系统管理员",
        departmentId: "dept-1",
        roleCodes: ["super-admin"],
        permissions: ["dashboard:view"],
        dataScopes: ["ALL"],
        sessionId: "session-1"
      })
    ).rejects.toThrow("登录状态已失效，请重新登录。");
  });

  it("configures and verifies mfa", async () => {
    const otp = await import("otplib");
    const authRepository = {
      findUserById: vi.fn().mockResolvedValue(buildAuthUserRecord({ roles: [] })),
      updateUserSecurityState: vi.fn().mockResolvedValue(undefined),
      replaceMfaRecoveryCodes: vi.fn().mockResolvedValue(undefined),
      findMfaRecoveryCode: vi.fn().mockResolvedValue(null)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: vi.fn()
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    const setup = await service.configureMfa(
      {
        id: "user-1",
        tenantId: "tenant-default",
        username: "admin",
        displayName: "系统管理员",
        roleCodes: [],
        permissions: []
      } as any,
      {}
    );

    expect(setup.challenge).toContain("otpauth://");
    expect(setup.enabled).toBe(false);
    expect(setup.pending).toBe(true);
    expect(authRepository.updateUserSecurityState).toHaveBeenCalledWith(
      "user-1",
      "tenant-default",
      expect.objectContaining({
        mfaPendingSecret: expect.any(String)
      })
    );
    const secret = authRepository.updateUserSecurityState.mock.calls[0][2].mfaPendingSecret;
    const token = otp.generateSync({ secret });
    authRepository.findUserById.mockResolvedValueOnce(buildAuthUserRecord({ roles: [], mfaPendingSecret: secret }));

    const configured = await service.configureMfa(
      {
        id: "user-1",
        tenantId: "tenant-default",
        username: "admin",
        displayName: "系统管理员",
        roleCodes: [],
        permissions: []
      } as any,
      { code: token }
    );

    expect(configured.enabled).toBe(true);
    expect(configured.pending).toBe(false);
    expect(configured.recoveryCodes).toHaveLength(5);
  });

  it("enforces mfa enrollment for privileged users and completes login only after challenge verification", async () => {
    const otp = await import("otplib");
    const passwordHash = await bcrypt.hash("Admin123456!Aa", 10);
    const pendingSecret = otp.generateSecret();
    const enrollmentToken = otp.generateSync({ secret: pendingSecret });
    const privilegedUser = buildAuthUserRecord({
      passwordHash,
      roles: [
        {
          role: {
            code: "tenant-admin",
            dataScope: "ALL",
            extendedDataScopes: [],
            fieldPermissionRules: [],
            actionPermissionRules: [],
            permissions: [{ permission: { code: "user:write" } }]
          }
        }
      ]
    });
    const challengeUser = buildAuthUserRecord({
      passwordHash,
      roles: [
        {
          role: {
            code: "tenant-admin",
            dataScope: "ALL",
            extendedDataScopes: [],
            fieldPermissionRules: [],
            actionPermissionRules: [],
            permissions: [{ permission: { code: "user:write" } }]
          }
        }
      ],
      mfaPendingSecret: pendingSecret
    });
    const authRepository = {
      findUserByUsername: vi.fn().mockResolvedValue(privilegedUser),
      updateUserSecurityState: vi.fn().mockResolvedValue(undefined),
      createMfaChallenge: vi.fn().mockResolvedValue({
        id: "challenge-1",
        tenantId: "tenant-default",
        user: challengeUser
      }),
      findMfaChallenge: vi.fn().mockResolvedValue({
        id: "challenge-1",
        tenantId: "tenant-default",
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: null,
        user: challengeUser
      }),
      consumeMfaChallenge: vi.fn().mockResolvedValue(undefined),
      replaceMfaRecoveryCodes: vi.fn().mockResolvedValue(undefined),
      createUserSession: vi.fn().mockResolvedValue({
        id: "session-1"
      })
    } as any;
    const jwtService = {
      signAsync: vi.fn().mockResolvedValue("token-123")
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(authRepository, jwtService, auditLogsService);

    const loginResult = await service.login({
      username: "admin",
      password: "Admin123456!Aa"
    });

    expect(loginResult).toMatchObject({
      success: false,
      mfaRequired: true,
      mfaEnrollmentRequired: true
    });
    if (loginResult.success) {
      throw new Error("expected an mfa challenge response");
    }
    expect(loginResult.mfaSetupChallenge).toContain("otpauth://");

    const verifiedResult = await service.verifyLoginMfa({
      ticket: loginResult.mfaTicket,
      code: enrollmentToken
    });

    expect(verifiedResult).toMatchObject({
      success: true,
      mfaRequired: false,
      mfaEnrollmentRequired: false,
      accessToken: "token-123"
    });
    expect(verifiedResult.mfaRecoveryCodes).toHaveLength(5);
    expect(authRepository.updateUserSecurityState).toHaveBeenCalledWith(
      "user-1",
      "tenant-default",
      expect.objectContaining({
        mfaEnabled: true,
        mfaSecret: pendingSecret,
        mfaPendingSecret: null
      })
    );
  });
});
