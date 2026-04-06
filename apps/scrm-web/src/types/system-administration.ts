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
