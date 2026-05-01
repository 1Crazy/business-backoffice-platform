import bcrypt from "bcryptjs";
import { UnauthorizedException } from "@nestjs/common";

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
  it("returns token, refresh token and flattened permissions after successful login", async () => {
    const passwordHash = await bcrypt.hash("Admin123456!", 10);
    const authRepository = {
      findUserByUsername: jest.fn().mockResolvedValue(buildAuthUserRecord({ passwordHash })),
      createUserSession: jest.fn().mockResolvedValue({
        id: "session-1"
      })
    } as any;
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("token-123")
    } as any;
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(authRepository, jwtService, auditLogsService);
    const result = await service.login({
      username: "admin",
      password: "Admin123456!"
    });

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

  it("refreshes an active session", async () => {
    const authRepository = {
      findSessionByRefreshTokenHash: jest.fn().mockResolvedValue({
        id: "session-1",
        tenantId: "tenant-default",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        user: buildAuthUserRecord()
      }),
      touchSession: jest.fn().mockResolvedValue(undefined)
    } as any;
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("token-456")
    } as any;
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(authRepository, jwtService, auditLogsService);
    const refreshToken = "a".repeat(96);
    const expectedHash = require("crypto").createHash("sha256").update(refreshToken).digest("hex");

    const result = await service.refresh({
      refreshToken
    });

    expect(authRepository.findSessionByRefreshTokenHash).toHaveBeenCalledWith(expectedHash);
    expect(authRepository.touchSession).toHaveBeenCalledWith("session-1");
    expect(result.accessToken).toBe("token-456");
    expect(result.user.roleCodes).toEqual(["super-admin"]);
  });

  it("rejects revoked sessions during payload validation", async () => {
    const authRepository = {
      findUserByUsername: jest.fn().mockResolvedValue(buildAuthUserRecord()),
      findSessionById: jest.fn().mockResolvedValue({
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
        signAsync: jest.fn().mockResolvedValue("token-123")
      } as any,
      {
        create: jest.fn().mockResolvedValue(undefined)
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
      revokeSession: jest.fn().mockResolvedValue({ count: 1 })
    } as any;
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(
      authRepository,
      {
        signAsync: jest.fn().mockResolvedValue("token-123")
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

  it("rejects disabled users during payload validation", async () => {
    const authRepository = {
      findUserByUsername: jest.fn().mockResolvedValue(buildAuthUserRecord({ status: "DISABLED", roles: [] })),
      findSessionById: jest.fn().mockResolvedValue({
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
        signAsync: jest.fn().mockResolvedValue("token-123")
      } as any,
      {
        create: jest.fn().mockResolvedValue(undefined)
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
    const passwordHash = await bcrypt.hash("Admin123456!", 10);
    const authRepository = {
      findUserByUsername: jest.fn().mockResolvedValue(
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
      create: jest.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: jest.fn()
      } as any,
      auditLogsService
    );

    await expect(
      service.login({
        username: "admin",
        password: "Admin123456!"
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
    const passwordHash = await bcrypt.hash("Admin123456!", 10);
    const authRepository = {
      findUserByUsername: jest.fn().mockResolvedValue(buildAuthUserRecord({ passwordHash }))
    } as any;
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: jest.fn()
      } as any,
      auditLogsService,
      new RiskThrottleService()
    );

    for (let index = 0; index < 5; index += 1) {
      await expect(
        service.login({
          username: "admin",
          password: "WrongPassword!"
        })
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }

    await expect(
      service.login({
        username: "admin",
        password: "WrongPassword!"
      })
    ).rejects.toThrow("Too many failed attempts");
  });

  it("throttles repeated invalid refresh token attempts", async () => {
    const authRepository = {
      findSessionByRefreshTokenHash: jest.fn().mockResolvedValue(null)
    } as any;
    const service = new AuthService(
      authRepository,
      {
        signAsync: jest.fn()
      } as any,
      {
        create: jest.fn().mockResolvedValue(undefined)
      } as any,
      new RiskThrottleService()
    );
    const refreshToken = "b".repeat(96);

    for (let index = 0; index < 10; index += 1) {
      await expect(service.refresh({ refreshToken })).rejects.toBeInstanceOf(UnauthorizedException);
    }

    await expect(service.refresh({ refreshToken })).rejects.toThrow("Too many failed attempts");
  });
});
