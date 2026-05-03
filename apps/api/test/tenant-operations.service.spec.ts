import { BadRequestException } from "@nestjs/common";

import { TenantOperationsService } from "../src/modules/tenant-operations/tenant-operations.service";

function buildActor(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-platform",
    tenantId: "tenant-default",
    tenantCode: "default",
    username: "platform-admin",
    displayName: "平台运营",
    roleCodes: ["super-admin"],
    permissions: ["tenant:read", "tenant:write"],
    ...overrides
  } as any;
}

function buildTenantRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "tenant-1",
    code: "acme",
    name: "Acme",
    status: "ACTIVE",
    isDefault: false,
    industry: "制造业",
    planName: "企业版",
    ownerName: "王强",
    ownerEmail: "wangqiang@acme.test",
    ownerPhone: "13800000000",
    initializedAt: new Date("2026-04-17T08:00:00.000Z"),
    disabledAt: null,
    archivedAt: null,
    userQuota: 20,
    storageQuotaMb: 1024,
    monthlyTaskQuota: 2000,
    createdAt: new Date("2026-04-17T08:00:00.000Z"),
    updatedAt: new Date("2026-04-17T08:00:00.000Z"),
    ...overrides
  } as any;
}

describe("TenantOperationsService", () => {
  const repository = {
    listTenants: vi.fn(),
    findTenantById: vi.fn(),
    listPermissionCatalog: vi.fn(),
    createTenantWithInitialization: vi.fn(),
    updateTenant: vi.fn(),
    revokeActiveSessionsByTenant: vi.fn(),
    countUsers: vi.fn(),
    sumAttachmentSizeBytes: vi.fn(),
    countBatchTasks: vi.fn(),
    countFailedBatchTasks: vi.fn(),
    countNotificationDeliveryFailures: vi.fn(),
    findLatestSessionActivity: vi.fn()
  };
  const auditLogsService = {
    create: vi.fn().mockResolvedValue(undefined)
  };
  const service = new TenantOperationsService(repository as any, auditLogsService as any);

  beforeEach(() => {
    vi.clearAllMocks();
    repository.countUsers.mockResolvedValueOnce(18).mockResolvedValueOnce(16);
    repository.sumAttachmentSizeBytes.mockResolvedValue(950 * 1024 * 1024);
    repository.countBatchTasks.mockResolvedValue(1800);
    repository.countFailedBatchTasks.mockResolvedValue(2);
    repository.countNotificationDeliveryFailures.mockResolvedValue(1);
    repository.findLatestSessionActivity.mockResolvedValue(new Date("2026-04-17T09:00:00.000Z"));
  });

  it("summarizes tenant usage and highlights quota pressure", async () => {
    repository.listTenants.mockResolvedValue([buildTenantRecord()]);

    const result = await service.listTenants();

    expect(result[0]).toMatchObject({
      code: "acme",
      runtimeStatus: "WARNING",
      quotas: {
        users: 20,
        storageQuotaMb: 1024,
        monthlyTasks: 2000
      },
      usage: {
        totalUsers: 18,
        activeUsers: 16,
        storageUsedMb: 950,
        monthlyTasks: 1800
      }
    });
    expect(result[0].runtimeHighlights).toEqual(
      expect.arrayContaining([
        "用户配额接近上限（18/20）。",
        "存储使用率偏高（950/1024 MB）。",
        "本月任务额度接近上限（1800/2000）。"
      ])
    );
  });

  it("creates a tenant together with initialized baseline resources", async () => {
    repository.listPermissionCatalog.mockResolvedValue([
      { id: "perm-tenant-read", code: "tenant:read" },
      { id: "perm-user-read", code: "user:read" },
      { id: "perm-customer-read", code: "customer:read" }
    ]);
    repository.createTenantWithInitialization.mockResolvedValue(buildTenantRecord());
    repository.countUsers.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    repository.sumAttachmentSizeBytes.mockResolvedValue(0);
    repository.countBatchTasks.mockResolvedValue(0);
    repository.countFailedBatchTasks.mockResolvedValue(0);
    repository.countNotificationDeliveryFailures.mockResolvedValue(0);
    repository.findLatestSessionActivity.mockResolvedValue(null);

    const result = await service.createTenant(
      {
        code: "acme",
        name: "Acme",
        industry: "制造业",
        ownerName: "王强",
        ownerEmail: "wangqiang@acme.test",
        adminUsername: "acme.admin",
        adminDisplayName: "Acme 管理员",
        adminPassword: "Admin123456!"
      } as any,
      buildActor()
    );

    expect(repository.createTenantWithInitialization).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "acme",
        adminUsername: "acme.admin",
        permissionIds: ["perm-user-read", "perm-customer-read"]
      })
    );
    expect(result.code).toBe("acme");
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "CREATE",
        targetType: "tenant"
      })
    );
  });

  it("disables a tenant and revokes active sessions", async () => {
    repository.findTenantById.mockResolvedValue(buildTenantRecord());
    repository.updateTenant.mockResolvedValue(
      buildTenantRecord({
        status: "DISABLED",
        disabledAt: new Date("2026-04-17T10:00:00.000Z")
      })
    );

    const result = await service.disableTenant("tenant-1", buildActor());

    expect(repository.revokeActiveSessionsByTenant).toHaveBeenCalledWith("tenant-1");
    expect(result.status).toBe("DISABLED");
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "DISABLE",
        targetType: "tenant"
      })
    );
  });

  it("rejects disabling the default tenant", async () => {
    repository.findTenantById.mockResolvedValue(
      buildTenantRecord({
        isDefault: true
      })
    );

    await expect(service.disableTenant("tenant-default", buildActor())).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateTenant).not.toHaveBeenCalled();
  });
});
