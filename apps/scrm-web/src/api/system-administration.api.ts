/** 领域 API：负责封装页面到后端的请求契约，避免页面直接依赖底层 HTTP 客户端。 */
import { http } from "@/api/http";
import type { AuditLog } from "@/types/audit-logs";
import type { DictionaryEntry } from "@/types/dictionaries";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  AuditLogQuery,
  BatchTaskCategory,
  BatchTaskRecord,
  BatchTaskStatus,
  CreateOpenApiCredentialPayload,
  IdentityConnectorRecord,
  NotificationChannelSnapshot,
  OpenApiCredentialRecord,
  SaveDictionaryPayload,
  SaveIdentityConnectorPayload,
  SaveWebhookSubscriptionPayload,
  SchedulerJobRecord,
  StorageGovernanceSnapshot,
  WebhookDeliveryRecord,
  WebhookSubscriptionRecord
} from "@/types/system-administration";

export async function fetchDictionaries(): Promise<DictionaryEntry[]> {
  const { data } = await http.get<DictionaryEntry[]>("/dictionaries");
  return data;
}

export async function fetchAuditLogs(query: AuditLogQuery): Promise<PaginatedResponse<AuditLog>> {
  const { data } = await http.get<PaginatedResponse<AuditLog>>("/audit-logs", {
    params: query
  });
  return data;
}

export async function createDictionary(payload: SaveDictionaryPayload): Promise<void> {
  await http.post("/dictionaries", payload);
}

export async function updateDictionary(dictionaryId: string, payload: SaveDictionaryPayload): Promise<void> {
  await http.patch(`/dictionaries/${dictionaryId}`, payload);
}

export async function fetchNotificationChannels(): Promise<NotificationChannelSnapshot[]> {
  const { data } = await http.get<
    Array<{
      id: string;
      channel: NotificationChannelSnapshot["channel"];
      adapterCode: string;
      provider: string;
      displayName: string;
      isEnabled: boolean;
      status: NotificationChannelSnapshot["status"];
      routeScope?: string | null;
      fallbackChannel?: string | null;
      recentFailures: number;
      updatedAt: string;
    }>
  >("/system-governance/notification-channels");
  return data.map((item) => ({
    id: item.id,
    channel: item.channel,
    adapterCode: item.adapterCode,
    provider: item.provider,
    label: item.displayName,
    enabled: item.isEnabled,
    status: item.status,
    routeScope: item.routeScope ?? "未配置",
    fallbackChannel: item.fallbackChannel ?? "无",
    recentFailures: item.recentFailures,
    updatedAt: item.updatedAt
  }));
}

export async function fetchStorageConfigs(): Promise<StorageGovernanceSnapshot[]> {
  const { data } = await http.get<
    Array<{
      id: string;
      code: string;
      displayName: string;
      provider: StorageGovernanceSnapshot["provider"];
      isEnabled: boolean;
      status: StorageGovernanceSnapshot["status"];
      bucketName: string;
      regionLabel: string;
      previewEnabled: boolean;
      updatedAt: string;
    }>
  >("/system-governance/storage-configs");
  return data.map((item) => ({
    id: item.id,
    code: item.code,
    label: item.displayName,
    provider: item.provider,
    enabled: item.isEnabled,
    status: item.status,
    bucketName: item.bucketName,
    regionLabel: item.regionLabel,
    previewEnabled: item.previewEnabled,
    updatedAt: item.updatedAt
  }));
}

export async function fetchSchedulerJobs(): Promise<SchedulerJobRecord[]> {
  const { data } = await http.get<
    Array<{
      id: string;
      code: string;
      displayName: string;
      cronExpression: string;
      status: SchedulerJobRecord["status"];
      ownerName: string;
      nextRunAt?: string | null;
      lastRunAt?: string | null;
      lastExecutionStatus?: SchedulerJobRecord["lastExecutionStatus"];
      lastErrorMessage?: string | null;
    }>
  >("/system-governance/scheduler-jobs");
  return data.map((item) => ({
    id: item.id,
    code: item.code,
    label: item.displayName,
    cronExpression: item.cronExpression,
    status: item.status,
    ownerName: item.ownerName,
    nextRunAt: item.nextRunAt ?? null,
    lastRunAt: item.lastRunAt ?? null,
    lastExecutionStatus: item.lastExecutionStatus ?? null,
    lastErrorMessage: item.lastErrorMessage ?? null
  }));
}

export async function fetchBatchTasks(query: {
  category?: BatchTaskCategory;
  status?: BatchTaskStatus;
  resourceType?: string;
} = {}): Promise<BatchTaskRecord[]> {
  const { data } = await http.get<
    Array<{
      id: string;
      category: BatchTaskRecord["category"];
      resourceType: string;
      label: string;
      status: BatchTaskRecord["status"];
      progress: number;
      totalCount: number;
      successCount: number;
      failureCount: number;
      summary?: string | null;
      failureSummary?: string | null;
      inputFileName?: string | null;
      resultFileName?: string | null;
      failureFileName?: string | null;
      operator: {
        displayName: string;
      };
      startedAt?: string | null;
      finishedAt?: string | null;
      updatedAt: string;
    }>
  >("/batch-tasks", {
    params: query
  });
  return data.map((item) => ({
    id: item.id,
    label: item.label,
    category: item.category,
    domainLabel: item.resourceType === "CUSTOMER" ? "客户中心" : item.resourceType,
    resourceType: item.resourceType,
    status: item.status,
    progress: item.progress,
    operatorName: item.operator.displayName,
    updatedAt: item.updatedAt,
    failureCount: item.failureCount,
    totalCount: item.totalCount,
    successCount: item.successCount,
    summary: item.summary ?? null,
    failureSummary: item.failureSummary ?? null,
    inputFileName: item.inputFileName ?? null,
    resultFileName: item.resultFileName ?? null,
    failureFileName: item.failureFileName ?? null,
    startedAt: item.startedAt ?? null,
    finishedAt: item.finishedAt ?? null
  }));
}

export async function fetchOpenApiCredentials(): Promise<OpenApiCredentialRecord[]> {
  const { data } = await http.get<OpenApiCredentialRecord[]>("/open-integration/credentials");
  return data;
}

export async function createOpenApiCredential(
  payload: CreateOpenApiCredentialPayload
): Promise<OpenApiCredentialRecord> {
  const { data } = await http.post<OpenApiCredentialRecord>("/open-integration/credentials", payload);
  return data;
}

export async function rotateOpenApiCredential(id: string): Promise<OpenApiCredentialRecord> {
  const { data } = await http.post<OpenApiCredentialRecord>(`/open-integration/credentials/${id}/rotate`);
  return data;
}

export async function revokeOpenApiCredential(id: string): Promise<OpenApiCredentialRecord> {
  const { data } = await http.post<OpenApiCredentialRecord>(`/open-integration/credentials/${id}/revoke`);
  return data;
}

export async function fetchWebhookSubscriptions(): Promise<WebhookSubscriptionRecord[]> {
  const { data } = await http.get<WebhookSubscriptionRecord[]>("/open-integration/webhooks");
  return data;
}

export async function createWebhookSubscription(
  payload: SaveWebhookSubscriptionPayload
): Promise<WebhookSubscriptionRecord> {
  const { data } = await http.post<WebhookSubscriptionRecord>("/open-integration/webhooks", payload);
  return data;
}

export async function updateWebhookSubscription(
  id: string,
  payload: SaveWebhookSubscriptionPayload
): Promise<WebhookSubscriptionRecord> {
  const { data } = await http.patch<WebhookSubscriptionRecord>(`/open-integration/webhooks/${id}`, payload);
  return data;
}

export async function triggerWebhookTest(id: string): Promise<WebhookDeliveryRecord> {
  const { data } = await http.post<WebhookDeliveryRecord>(`/open-integration/webhooks/${id}/test`);
  return data;
}

export async function fetchWebhookDeliveries(id: string): Promise<WebhookDeliveryRecord[]> {
  const { data } = await http.get<WebhookDeliveryRecord[]>(`/open-integration/webhooks/${id}/deliveries`);
  return data;
}

export async function fetchIdentityConnectors(): Promise<IdentityConnectorRecord[]> {
  const { data } = await http.get<IdentityConnectorRecord[]>("/open-integration/connectors");
  return data.map((item) => ({
    ...item,
    allowedDomains: Array.isArray(item.allowedDomains) ? item.allowedDomains : []
  }));
}

export async function createIdentityConnector(
  payload: SaveIdentityConnectorPayload
): Promise<IdentityConnectorRecord> {
  const { data } = await http.post<IdentityConnectorRecord>("/open-integration/connectors", payload);
  return data;
}

export async function updateIdentityConnector(
  id: string,
  payload: SaveIdentityConnectorPayload
): Promise<IdentityConnectorRecord> {
  const { data } = await http.patch<IdentityConnectorRecord>(`/open-integration/connectors/${id}`, payload);
  return data;
}
