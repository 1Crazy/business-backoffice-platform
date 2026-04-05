import bcrypt from "bcryptjs";
import { UnauthorizedException } from "@nestjs/common";

import { AuthService } from "../src/modules/auth/auth.service";

describe("AuthService", () => {
  it("returns token, refresh token and flattened permissions after successful login", async () => {
    const passwordHash = await bcrypt.hash("Admin123456!", 10);
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "user-1",
          username: "admin",
          displayName: "系统管理员",
          departmentId: "dept-1",
          status: "ACTIVE",
          passwordHash,
          roles: [
            {
              role: {
                code: "super-admin",
                dataScope: "ALL",
                permissions: [
                  { permission: { code: "dashboard:view" } },
                  { permission: { code: "customer:read" } }
                ]
              }
            }
          ]
        })
      },
      userSession: {
        create: jest.fn().mockResolvedValue({
          id: "session-1"
        })
      }
    } as any;

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("token-123")
    } as any;

    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(prisma, jwtService, auditLogsService);
    const result = await service.login({
      username: "admin",
      password: "Admin123456!"
    });

    expect(result.accessToken).toBe("token-123");
    expect(result.refreshToken).toBeTruthy();
    expect(result.user.permissions).toEqual(["dashboard:view", "customer:read"]);
    expect(auditLogsService.create).toHaveBeenCalled();
  });

  it("refreshes an active session", async () => {
    const prisma = {
      userSession: {
        findUnique: jest.fn().mockResolvedValue({
          id: "session-1",
          userId: "user-1",
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: null,
          user: {
            id: "user-1",
            username: "admin",
            displayName: "系统管理员",
            departmentId: "dept-1",
            status: "ACTIVE",
            roles: [
              {
                role: {
                  code: "super-admin",
                  dataScope: "ALL",
                  permissions: [{ permission: { code: "dashboard:view" } }]
                }
              }
            ]
          }
        }),
        update: jest.fn().mockResolvedValue(undefined)
      }
    } as any;

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("token-456")
    } as any;

    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(prisma, jwtService, auditLogsService);
    const loginResult = await service.login({
      username: "admin",
      password: "Admin123456!"
    }).catch(() => null);

    const refreshToken =
      loginResult?.refreshToken ??
      "a".repeat(96);

    const expectedHash = require("crypto").createHash("sha256").update(refreshToken).digest("hex");
    prisma.userSession.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user: {
        id: "user-1",
        username: "admin",
        displayName: "系统管理员",
        departmentId: "dept-1",
        status: "ACTIVE",
        roles: [
          {
            role: {
              code: "super-admin",
              dataScope: "ALL",
              permissions: [{ permission: { code: "dashboard:view" } }]
            }
          }
        ]
      }
    });

    const result = await service.refresh({
      refreshToken
    });

    expect(prisma.userSession.findUnique).toHaveBeenCalledWith({
      where: {
        refreshTokenHash: expectedHash
      },
      include: expect.any(Object)
    });
    expect(result.accessToken).toBe("token-456");
  });

  it("rejects revoked sessions during payload validation", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "user-1",
          username: "admin",
          displayName: "系统管理员",
          departmentId: "dept-1",
          status: "ACTIVE",
          roles: [
            {
              role: {
                code: "super-admin",
                dataScope: "ALL",
                permissions: [{ permission: { code: "dashboard:view" } }]
              }
            }
          ]
        })
      },
      userSession: {
        findUnique: jest.fn().mockResolvedValue({
          id: "session-1",
          userId: "user-1",
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: new Date()
        })
      }
    } as any;

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("token-123")
    } as any;

    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(prisma, jwtService, auditLogsService);

    await expect(
      service.validateSessionPayload({
        id: "user-1",
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
    const prisma = {
      userSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    } as any;

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("token-123")
    } as any;

    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(prisma, jwtService, auditLogsService);
    const result = await service.logout({
      id: "user-1",
      username: "admin",
      displayName: "系统管理员",
      departmentId: "dept-1",
      roleCodes: ["super-admin"],
      permissions: ["dashboard:view"],
      dataScopes: ["ALL"],
      sessionId: "session-1"
    });

    expect(prisma.userSession.updateMany).toHaveBeenCalled();
    expect(auditLogsService.create).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("rejects disabled users during payload validation", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "user-1",
          username: "admin",
          displayName: "系统管理员",
          departmentId: "dept-1",
          status: "DISABLED",
          roles: []
        })
      },
      userSession: {
        findUnique: jest.fn().mockResolvedValue({
          id: "session-1",
          userId: "user-1",
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: null
        })
      }
    } as any;

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("token-123")
    } as any;

    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;

    const service = new AuthService(prisma, jwtService, auditLogsService);

    await expect(
      service.validateSessionPayload({
        id: "user-1",
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
});
