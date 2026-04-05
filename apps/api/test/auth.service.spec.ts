import bcrypt from "bcryptjs";

import { AuthService } from "../src/modules/auth/auth.service";

describe("AuthService", () => {
  it("returns token and flattened permissions after successful login", async () => {
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
                permissions: [
                  { permission: { code: "dashboard:view" } },
                  { permission: { code: "customer:read" } }
                ]
              }
            }
          ]
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
    expect(result.user.permissions).toEqual(["dashboard:view", "customer:read"]);
    expect(auditLogsService.create).toHaveBeenCalled();
  });
});

