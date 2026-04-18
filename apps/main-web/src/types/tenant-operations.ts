export type TenantLifecycleStatus = "ACTIVE" | "DISABLED" | "ARCHIVED";
export type TenantRuntimeStatus = "HEALTHY" | "WARNING" | "ERROR";

export interface TenantOperationsSnapshot {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "DISABLED";
  lifecycleStatus: TenantLifecycleStatus;
  isDefault: boolean;
  industry?: string | null;
  planName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string | null;
  initializedAt?: string | null;
  disabledAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  quotas: {
    users: number;
    storageQuotaMb: number;
    monthlyTasks: number;
  };
  usage: {
    totalUsers: number;
    activeUsers: number;
    storageUsedMb: number;
    monthlyTasks: number;
    failedTasksLast30Days: number;
    notificationFailuresLast7Days: number;
    lastActivityAt?: string | null;
  };
  runtimeStatus: TenantRuntimeStatus;
  runtimeHighlights: string[];
}

export interface CreateTenantPayload {
  code: string;
  name: string;
  industry?: string;
  planName?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  adminUsername: string;
  adminDisplayName: string;
  adminPassword: string;
  userQuota?: number;
  storageQuotaMb?: number;
  monthlyTaskQuota?: number;
}

export interface UpdateTenantQuotasPayload {
  userQuota?: number;
  storageQuotaMb?: number;
  monthlyTaskQuota?: number;
}

export interface TenantCreateFormModel {
  code: string;
  name: string;
  industry: string;
  planName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  adminUsername: string;
  adminDisplayName: string;
  adminPassword: string;
  userQuota: number;
  storageQuotaMb: number;
  monthlyTaskQuota: number;
}

export interface TenantQuotaFormModel {
  tenantId: string;
  tenantName: string;
  userQuota: number;
  storageQuotaMb: number;
  monthlyTaskQuota: number;
}
