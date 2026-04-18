import { http } from "@/api/http";
import type {
  CreateTenantPayload,
  TenantOperationsSnapshot,
  UpdateTenantQuotasPayload
} from "@/types/tenant-operations";

export async function fetchTenants(): Promise<TenantOperationsSnapshot[]> {
  const response = await http.get<TenantOperationsSnapshot[]>("/tenant-operations/tenants");
  return response.data;
}

export async function createTenant(payload: CreateTenantPayload): Promise<void> {
  await http.post("/tenant-operations/tenants", payload);
}

export async function updateTenantQuotas(tenantId: string, payload: UpdateTenantQuotasPayload): Promise<void> {
  await http.patch(`/tenant-operations/tenants/${tenantId}/quotas`, payload);
}

export async function enableTenant(tenantId: string): Promise<void> {
  await http.patch(`/tenant-operations/tenants/${tenantId}/enable`);
}

export async function disableTenant(tenantId: string): Promise<void> {
  await http.patch(`/tenant-operations/tenants/${tenantId}/disable`);
}

export async function archiveTenant(tenantId: string): Promise<void> {
  await http.patch(`/tenant-operations/tenants/${tenantId}/archive`);
}
