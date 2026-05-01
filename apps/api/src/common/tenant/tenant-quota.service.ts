/** 租户配额服务：集中计算当前租户资源用量，并在写入边界提供统一的拒绝错误。 */
import { BadRequestException, Injectable } from "@nestjs/common";

import { TenantQuotaRepository } from "./repositories/tenant-quota.repository";

export type TenantQuotaType = "users" | "storage" | "monthlyTasks";

interface TenantQuotaDetails {
  type: TenantQuotaType;
  limit: number;
  used: number;
  requested: number;
  message: string;
}

export class TenantQuotaExceededException extends BadRequestException {
  readonly quota: TenantQuotaDetails;

  constructor(quota: TenantQuotaDetails) {
    super({
      code: "TENANT_QUOTA_EXCEEDED",
      message: quota.message,
      quota
    });
    this.quota = quota;
  }
}

@Injectable()
export class TenantQuotaService {
  constructor(private readonly tenantQuotaRepository: TenantQuotaRepository) {}

  async assertUserQuotaAvailable(tenantId: string): Promise<void> {
    const [tenant, activeUsers] = await Promise.all([
      this.tenantQuotaRepository.getTenantQuotas(tenantId),
      this.tenantQuotaRepository.countActiveUsers(tenantId)
    ]);

    this.assertWithinQuota({
      type: "users",
      limit: tenant.userQuota,
      used: activeUsers,
      requested: 1,
      message: "租户用户配额不足。"
    });
  }

  async assertStorageQuotaAvailable(tenantId: string, incomingBytes: number): Promise<void> {
    const [tenant, usedBytes] = await Promise.all([
      this.tenantQuotaRepository.getTenantQuotas(tenantId),
      this.tenantQuotaRepository.sumAttachmentSizeBytes(tenantId)
    ]);
    const quotaBytes = tenant.storageQuotaMb * 1024 * 1024;

    this.assertWithinQuota({
      type: "storage",
      limit: quotaBytes,
      used: usedBytes,
      requested: incomingBytes,
      message: "租户存储配额不足。"
    });
  }

  async assertMonthlyTaskQuotaAvailable(tenantId: string, now = new Date()): Promise<void> {
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const [tenant, monthlyTasks] = await Promise.all([
      this.tenantQuotaRepository.getTenantQuotas(tenantId),
      this.tenantQuotaRepository.countBatchTasksSince(tenantId, monthStart)
    ]);

    this.assertWithinQuota({
      type: "monthlyTasks",
      limit: tenant.monthlyTaskQuota,
      used: monthlyTasks,
      requested: 1,
      message: "租户月度任务配额不足。"
    });
  }

  private assertWithinQuota(details: TenantQuotaDetails): void {
    if (details.used + details.requested > details.limit) {
      throw new TenantQuotaExceededException(details);
    }
  }
}
