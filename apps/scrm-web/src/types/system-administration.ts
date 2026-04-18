/** 领域类型定义：负责维护当前子域的请求、响应和表单模型契约。 */
import type { SortOrder } from "@/types/pagination";

export interface DictionaryFormModel {
  id: string;
  type: string;
  label: string;
  value: string;
  sort: number;
  enabled: boolean;
}

export interface AuditLogFilters {
  actorName: string;
  actionType: string;
  targetType: string;
  dateRange: [string, string] | [] | null;
}

export interface AuditLogTableState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sortBy: string;
  sortOrder: SortOrder;
  sortPreset: string;
}

export interface AuditLogQuery {
  actorName?: string;
  actionType?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: SortOrder;
}

export interface SaveDictionaryPayload {
  type: string;
  label: string;
  value: string;
  sort: number;
  enabled: boolean;
}

export type GovernanceHealthStatus = "HEALTHY" | "WARNING" | "ERROR";
export type StorageProvider = "LOCAL" | "OSS" | "S3";
export type BatchTaskCategory = "IMPORT" | "EXPORT";
export type BatchTaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
export type SchedulerJobStatus = "RUNNING" | "PAUSED";
export type SchedulerExecutionStatus = "RUNNING" | "SUCCEEDED" | "FAILED";
export type NotificationChannel = "IN_APP" | "EMAIL" | "ENTERPRISE_IM";
export type OpenApiCredentialStatus = "ACTIVE" | "REVOKED";
export type WebhookSubscriptionStatus = "ACTIVE" | "DISABLED";
export type WebhookDeliveryStatus = "PENDING" | "SUCCEEDED" | "FAILED";
export type IdentityConnectorType = "SSO" | "LDAP" | "OAUTH";
export type IdentityConnectorMatchField = "USERNAME" | "EMAIL";

export interface NotificationChannelSnapshot {
  id: string;
  label: string;
  channel: NotificationChannel;
  adapterCode: string;
  provider: string;
  enabled: boolean;
  status: GovernanceHealthStatus;
  routeScope: string;
  fallbackChannel: string;
  recentFailures: number;
  updatedAt: string;
}

export interface StorageGovernanceSnapshot {
  id: string;
  code: string;
  label: string;
  provider: StorageProvider;
  status: GovernanceHealthStatus;
  enabled: boolean;
  bucketName: string;
  regionLabel: string;
  previewEnabled: boolean;
  updatedAt: string;
}

export interface BatchTaskRecord {
  id: string;
  label: string;
  category: BatchTaskCategory;
  domainLabel: string;
  resourceType: string;
  status: BatchTaskStatus;
  progress: number;
  operatorName: string;
  updatedAt: string;
  failureCount: number;
  totalCount: number;
  successCount: number;
  summary?: string | null;
  failureSummary?: string | null;
  inputFileName?: string | null;
  resultFileName?: string | null;
  failureFileName?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface BatchTaskFilters {
  category: BatchTaskCategory | "";
  status: BatchTaskStatus | "";
}

export interface SchedulerJobRecord {
  id: string;
  code: string;
  label: string;
  cronExpression: string;
  status: SchedulerJobStatus;
  ownerName: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastExecutionStatus?: SchedulerExecutionStatus | null;
  lastErrorMessage?: string | null;
}

export interface OpenApiCredentialRecord {
  id: string;
  name: string;
  accessKey: string;
  scopes: string[];
  status: OpenApiCredentialStatus;
  expiresAt: string | null;
  lastUsedAt: string | null;
  rotatedAt: string | null;
  revokedAt: string | null;
  createdByName?: string | null;
  plainSecret?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOpenApiCredentialPayload {
  name: string;
  scopes: string[];
  expiresAt?: string;
}

export interface OpenApiCredentialFormModel {
  name: string;
  scopes: string[];
  expiresAt: string;
}

export interface WebhookDeliveryRecord {
  id: string;
  eventType: string;
  sourceType: string;
  sourceId: string;
  status: WebhookDeliveryStatus;
  attemptCount: number;
  signature: string;
  responseStatusCode?: number | null;
  responseBody?: string | null;
  errorMessage?: string | null;
  nextRetryAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface WebhookSubscriptionRecord {
  id: string;
  name: string;
  endpointUrl: string;
  eventTypes: string[];
  status: WebhookSubscriptionStatus;
  signingSecretHint: string;
  maxAttempts: number;
  timeoutSeconds: number;
  lastTriggeredAt: string | null;
  lastDeliveryStatus?: WebhookDeliveryStatus | null;
  lastFailureMessage?: string | null;
  createdByName?: string | null;
  updatedByName?: string | null;
  plainSigningSecret?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveWebhookSubscriptionPayload {
  name: string;
  endpointUrl: string;
  eventTypes: string[];
  status: WebhookSubscriptionStatus;
  maxAttempts: number;
  timeoutSeconds: number;
  rotateSecret?: boolean;
}

export interface WebhookSubscriptionFormModel {
  id: string;
  name: string;
  endpointUrl: string;
  eventTypes: string[];
  status: WebhookSubscriptionStatus;
  maxAttempts: number;
  timeoutSeconds: number;
  rotateSecret: boolean;
}

export interface IdentityConnectorRecord {
  id: string;
  name: string;
  type: IdentityConnectorType;
  status: "ACTIVE" | "DISABLED";
  matchField: IdentityConnectorMatchField;
  issuerUrl?: string | null;
  authorizeUrl?: string | null;
  tokenUrl?: string | null;
  directoryUrl?: string | null;
  clientId?: string | null;
  clientSecretHint?: string | null;
  allowedDomains: string[];
  config?: Record<string, unknown> | null;
  lastAuthenticatedAt?: string | null;
  lastFailureAt?: string | null;
  lastFailureMessage?: string | null;
  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveIdentityConnectorPayload {
  name: string;
  type: IdentityConnectorType;
  status: "ACTIVE" | "DISABLED";
  matchField: IdentityConnectorMatchField;
  issuerUrl?: string;
  authorizeUrl?: string;
  tokenUrl?: string;
  directoryUrl?: string;
  clientId?: string;
  clientSecret?: string;
  allowedDomains?: string[];
  config?: Record<string, unknown>;
}

export interface IdentityConnectorFormModel {
  id: string;
  name: string;
  type: IdentityConnectorType;
  status: "ACTIVE" | "DISABLED";
  matchField: IdentityConnectorMatchField;
  issuerUrl: string;
  authorizeUrl: string;
  tokenUrl: string;
  directoryUrl: string;
  clientId: string;
  clientSecret: string;
  allowedDomainsText: string;
  configText: string;
}

export interface SecretRevealNotice {
  type: "credential" | "webhook";
  label: string;
  secret: string;
}
