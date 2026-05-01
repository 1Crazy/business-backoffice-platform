import { TenantQuotaExceededException, TenantQuotaService } from "../src/common/tenant/tenant-quota.service";

describe("TenantQuotaService", () => {
  const repository = {
    getTenantQuotas: jest.fn(),
    countActiveUsers: jest.fn(),
    sumAttachmentSizeBytes: jest.fn(),
    countBatchTasksSince: jest.fn()
  };
  const service = new TenantQuotaService(repository as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects active user growth when the current tenant reaches userQuota", async () => {
    repository.getTenantQuotas.mockResolvedValue({
      userQuota: 2,
      storageQuotaMb: 100,
      monthlyTaskQuota: 100
    });
    repository.countActiveUsers.mockResolvedValue(2);

    await expect(service.assertUserQuotaAvailable("tenant-a")).rejects.toBeInstanceOf(
      TenantQuotaExceededException
    );

    expect(repository.countActiveUsers).toHaveBeenCalledWith("tenant-a");
  });

  it("uses only current tenant attachments when checking storageQuotaMb", async () => {
    repository.getTenantQuotas.mockResolvedValue({
      userQuota: 50,
      storageQuotaMb: 1,
      monthlyTaskQuota: 100
    });
    repository.sumAttachmentSizeBytes.mockResolvedValue(900 * 1024);

    await expect(service.assertStorageQuotaAvailable("tenant-a", 200 * 1024)).rejects.toMatchObject({
      quota: expect.objectContaining({
        type: "storage",
        limit: 1024 * 1024,
        used: 900 * 1024,
        requested: 200 * 1024
      })
    });

    expect(repository.sumAttachmentSizeBytes).toHaveBeenCalledWith("tenant-a");
  });

  it("counts only current tenant tasks from the current UTC month", async () => {
    repository.getTenantQuotas.mockResolvedValue({
      userQuota: 50,
      storageQuotaMb: 100,
      monthlyTaskQuota: 3
    });
    repository.countBatchTasksSince.mockResolvedValue(3);

    await expect(
      service.assertMonthlyTaskQuotaAvailable("tenant-a", new Date("2026-05-15T08:00:00.000Z"))
    ).rejects.toMatchObject({
      quota: expect.objectContaining({
        type: "monthlyTasks"
      })
    });

    expect(repository.countBatchTasksSince).toHaveBeenCalledWith(
      "tenant-a",
      new Date("2026-05-01T00:00:00.000Z")
    );
  });
});
