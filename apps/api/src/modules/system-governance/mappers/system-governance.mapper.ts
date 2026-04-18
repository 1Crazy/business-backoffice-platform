/** system-governance 模块 mapper：负责把持久化结果转换为系统治理对外契约。 */
import { toIsoString } from "@/common/mappers/date-time.mapper";
import type {
  NotificationChannelConfigRecord,
  SchedulerJobExecutionRecord,
  SchedulerJobRecord,
  StorageConfigRecord
} from "../repositories/system-governance.repository";

export function mapNotificationChannelConfig(record: NotificationChannelConfigRecord, recentFailures: number) {
  const capabilities = readRecordObject(record.capabilities);
  const config = readRecordObject(record.config);

  return {
    id: record.id,
    channel: record.channel,
    adapterCode: record.adapterCode,
    provider: record.provider,
    displayName: record.displayName,
    description: record.description ?? null,
    isEnabled: record.isEnabled,
    status: recentFailures > 0 || !record.isEnabled ? "WARNING" : "HEALTHY",
    routeScope: readString(capabilities?.routeScope) ?? null,
    fallbackChannel: readString(config?.fallbackChannel) ?? readString(capabilities?.fallbackChannel) ?? null,
    recentFailures,
    config,
    capabilities,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapStorageConfig(record: StorageConfigRecord) {
  return {
    id: record.id,
    code: record.code,
    displayName: record.displayName,
    provider: record.provider,
    isEnabled: record.isEnabled,
    status: record.status,
    bucketName: record.bucketName,
    regionLabel: record.regionLabel,
    previewEnabled: record.previewEnabled,
    config: readRecordObject(record.config),
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapSchedulerJob(record: SchedulerJobRecord) {
  return {
    id: record.id,
    code: record.code,
    displayName: record.displayName,
    description: record.description ?? null,
    cronExpression: record.cronExpression,
    status: record.status,
    ownerName: record.ownerName,
    nextRunAt: toIsoString(record.nextRunAt) ?? null,
    lastRunAt: toIsoString(record.lastRunAt) ?? null,
    lastExecutionStatus: record.lastExecutionStatus ?? null,
    lastErrorMessage: record.lastErrorMessage ?? null,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapSchedulerJobExecution(record: SchedulerJobExecutionRecord) {
  return {
    id: record.id,
    jobId: record.jobId,
    status: record.status,
    summary: record.summary ?? null,
    errorMessage: record.errorMessage ?? null,
    startedAt: toIsoString(record.startedAt)!,
    finishedAt: toIsoString(record.finishedAt) ?? null,
    durationMs: record.durationMs ?? null,
    createdAt: toIsoString(record.createdAt)!
  };
}

function readRecordObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
