/** 批任务 mapper：负责把持久化结果转换为接口返回结构。 */
import { toIsoString } from "@/common/mappers/date-time.mapper";
import type { BatchTaskFailureRecord, BatchTaskRecord } from "../repositories/batch-tasks.repository";

export function mapBatchTask(record: BatchTaskRecord) {
  return {
    id: record.id,
    category: record.category,
    resourceType: record.resourceType,
    label: record.label,
    status: record.status,
    progress: record.progress,
    totalCount: record.totalCount,
    successCount: record.successCount,
    failureCount: record.failureCount,
    filterSnapshot: readRecordObject(record.filterSnapshot),
    summary: record.summary ?? null,
    failureSummary: record.failureSummary ?? null,
    inputFileName: record.inputFileName ?? null,
    resultFileName: record.resultFileName ?? null,
    failureFileName: record.failureFileName ?? null,
    operator: {
      id: record.operator.id,
      displayName: record.operator.displayName
    },
    startedAt: toIsoString(record.startedAt) ?? null,
    finishedAt: toIsoString(record.finishedAt) ?? null,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapBatchTaskFailure(record: BatchTaskFailureRecord) {
  return {
    id: record.id,
    rowNumber: record.rowNumber ?? null,
    identifier: record.identifier ?? null,
    reason: record.reason,
    payload: readRecordObject(record.payload),
    createdAt: toIsoString(record.createdAt)!
  };
}

function readRecordObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
