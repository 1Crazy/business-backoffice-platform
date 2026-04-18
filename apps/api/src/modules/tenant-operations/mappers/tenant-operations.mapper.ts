import { GovernanceHealthStatus, type RecordStatus } from "@prisma/client";

import { toIsoString } from "@/common/mappers/date-time.mapper";
import type { TenantRecord } from "../repositories/tenant-operations.repository";

export type TenantLifecycleStatus = RecordStatus | "ARCHIVED";

export function mapTenantOperationsSnapshot(
  record: TenantRecord,
  input: {
    lifecycleStatus: TenantLifecycleStatus;
    runtimeStatus: GovernanceHealthStatus;
    runtimeHighlights: string[];
    usage: {
      totalUsers: number;
      activeUsers: number;
      storageUsedMb: number;
      monthlyTasks: number;
      failedTasksLast30Days: number;
      notificationFailuresLast7Days: number;
      lastActivityAt: Date | null;
    };
  }
) {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    status: record.status,
    lifecycleStatus: input.lifecycleStatus,
    isDefault: record.isDefault,
    industry: record.industry ?? null,
    planName: record.planName,
    ownerName: record.ownerName,
    ownerEmail: record.ownerEmail,
    ownerPhone: record.ownerPhone ?? null,
    initializedAt: toIsoString(record.initializedAt) ?? null,
    disabledAt: toIsoString(record.disabledAt) ?? null,
    archivedAt: toIsoString(record.archivedAt) ?? null,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!,
    quotas: {
      users: record.userQuota,
      storageQuotaMb: record.storageQuotaMb,
      monthlyTasks: record.monthlyTaskQuota
    },
    usage: {
      totalUsers: input.usage.totalUsers,
      activeUsers: input.usage.activeUsers,
      storageUsedMb: input.usage.storageUsedMb,
      monthlyTasks: input.usage.monthlyTasks,
      failedTasksLast30Days: input.usage.failedTasksLast30Days,
      notificationFailuresLast7Days: input.usage.notificationFailuresLast7Days,
      lastActivityAt: toIsoString(input.usage.lastActivityAt) ?? null
    },
    runtimeStatus: input.runtimeStatus,
    runtimeHighlights: input.runtimeHighlights
  };
}
