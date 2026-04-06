/** 分页基础设施：负责统一分页入参、排序规则和分页响应契约。 */
import type { SortOrder } from "./pagination-query.dto";

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sortBy?: string;
  sortOrder: SortOrder;
}
