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
    createUser: jest.fn(),
    updateStatus: jest.fn()
  };
  const auditLogsService = {
    create: jest.fn().mockResolvedValue(undefined)
  };
  const tenantQuotaService = {
    assertUserQuotaAvailable: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
          password: "Password123",
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
});
