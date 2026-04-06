/** 领域类型定义：负责维护当前子域的请求、响应和表单模型契约。 */
export type SortOrder = "asc" | "desc";

export interface PaginatedQuery {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder: SortOrder;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sortBy?: string;
  sortOrder: SortOrder;
}
