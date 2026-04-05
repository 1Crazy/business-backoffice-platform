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
