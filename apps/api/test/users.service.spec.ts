import bcrypt from "bcryptjs";
import { BadRequestException } from "@nestjs/common";
import { UserStatus } from "@prisma/client";

import { TenantQuotaExceededException } from "../src/common/tenant/tenant-quota.service";
import { UsersService } from "../src/modules/users/users.service";
function buildActor() {
  return {
    id: "manager-1",
    tenantId: "tenant-a",
    tenantCode: "tenant-a",
    username: "manager",
    displayName: "管理员",
    roleCodes: ["tenant-admin"],
    permissions: ["user:write"]
  } as any;
}

describe("UsersService", () => {
  const usersRepository = {
    createUser: vi.fn(),
    updateStatus: vi.fn(),
    unlockUser: vi.fn(),
    createPasswordHistory: vi.fn(),
    findById: vi.fn(),
    updateUser: vi.fn(),
    listPasswordHistory: vi.fn()
  };
  const auditLogsService = {
    create: vi.fn().mockResolvedValue(undefined)
  };
  const tenantQuotaService = {
    assertUserQuotaAvailable: vi.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tenantQuotaService.assertUserQuotaAvailable.mockResolvedValue(undefined);
  });

  it("rejects employee creation when userQuota is exceeded and records audit context", async () => {
    tenantQuotaService.assertUserQuotaAvailable.mockRejectedValue(
      new TenantQuotaExceededException({
        type: "users",
        limit: 2,
        used: 2,
        requested: 1,
        message: "租户用户配额不足。"
      })
    );
    const service = new UsersService(usersRepository as any, auditLogsService as any, tenantQuotaService as any);

    await expect(
      service.create(
        {
          username: "new-user",
          displayName: "新员工",
          password: "Password123!A",
          roleIds: []
        },
        buildActor()
      )
    ).rejects.toThrow("租户用户配额不足。");

    expect(usersRepository.createUser).not.toHaveBeenCalled();
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "ACCESS_DENIED",
        targetType: "tenant-quota",
        detail: expect.objectContaining({
          quotaType: "users",
          attemptedOperation: "user.create"
        })
      })
    );
  });

  it("checks userQuota before enabling a disabled employee", async () => {
    usersRepository.updateStatus.mockResolvedValue({
      id: "user-2",
      tenantId: "tenant-a",
      username: "user-2",
      displayName: "员工",
      status: UserStatus.ACTIVE,
      email: null,
      phone: null,
      department: null,
      roles: []
    });
    const service = new UsersService(usersRepository as any, auditLogsService as any, tenantQuotaService as any);

    await service.toggle("user-2", UserStatus.ACTIVE, buildActor());

    expect(tenantQuotaService.assertUserQuotaAvailable).toHaveBeenCalledWith("tenant-a");
    expect(usersRepository.updateStatus).toHaveBeenCalledWith("user-2", "tenant-a", UserStatus.ACTIVE);
  });

  it("persists password history when creating a user", async () => {
    usersRepository.createUser.mockResolvedValue({
      id: "user-3",
      tenantId: "tenant-a",
      username: "user-3",
      displayName: "员工",
      status: UserStatus.ACTIVE,
      email: null,
      phone: null,
      department: null,
      roles: []
    });
    const service = new UsersService(usersRepository as any, auditLogsService as any, tenantQuotaService as any);

    await service.create(
      {
        username: "user-3",
        displayName: "员工",
        password: "Password123!A",
        roleIds: []
      },
      buildActor()
    );

    expect(usersRepository.createPasswordHistory).toHaveBeenCalledWith("user-3", expect.any(String));
  });

  it("rejects password reuse when updating a user", async () => {
    const currentHash = await bcrypt.hash("Password123!A", 4);
    usersRepository.findById.mockResolvedValue({
      id: "user-3",
      tenantId: "tenant-a",
      username: "user-3",
      displayName: "员工",
      passwordHash: currentHash
    });
    usersRepository.listPasswordHistory.mockResolvedValue([]);
    const service = new UsersService(usersRepository as any, auditLogsService as any, tenantQuotaService as any);

    await expect(
      service.update(
        "user-3",
        {
          password: "Password123!A"
        },
        buildActor()
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects weak passwords during user creation", async () => {
    const service = new UsersService(usersRepository as any, auditLogsService as any, tenantQuotaService as any);

    await expect(
      service.create(
        {
          username: "weak-user",
          displayName: "弱口令员工",
          password: "Password123",
          roleIds: []
        },
        buildActor()
      )
    ).rejects.toThrow("密码复杂度不符合要求");
  });

  it("allows administrators to clear a permanent lock", async () => {
    usersRepository.unlockUser.mockResolvedValue({
      id: "user-9",
      tenantId: "tenant-a",
      username: "user-9",
      displayName: "员工",
      status: UserStatus.ACTIVE,
      lockedAt: null,
      securityLockStatus: "NONE",
      securityLockReason: null,
      securityLockReviewedAt: new Date("2026-05-03T00:00:00.000Z"),
      email: null,
      phone: null,
      department: null,
      roles: []
    });
    const service = new UsersService(usersRepository as any, auditLogsService as any, tenantQuotaService as any);

    const result = await service.unlock("user-9", buildActor());

    expect(usersRepository.unlockUser).toHaveBeenCalledWith("user-9", "tenant-a");
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "user-lock",
        targetId: "user-9",
        detail: expect.objectContaining({
          action: "security-review-clear"
        })
      })
    );
    expect(result).toMatchObject({
      id: "user-9",
      lockedAt: null,
      securityLockStatus: "NONE"
    });
  });
});
