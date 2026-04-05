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
