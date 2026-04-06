/** 分页基础设施：负责统一分页入参、排序规则和分页响应契约。 */
import type { Prisma } from "@prisma/client";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type PaginationQueryDto,
  type SortOrder
} from "./pagination-query.dto";
import type { PaginatedResponse } from "./paginated-response.interface";

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface ResolvedSort<TField extends string> {
  field: TField;
  order: Prisma.SortOrder;
}

export function getPaginationParams(query?: Partial<PaginationQueryDto>): PaginationParams {
  const page = Math.max(query?.page ?? DEFAULT_PAGE, 1);
  const pageSize = Math.max(query?.pageSize ?? DEFAULT_PAGE_SIZE, 1);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

export function resolveSort<TField extends string>(
  query: Partial<PaginationQueryDto> | undefined,
  allowedFields: readonly TField[],
  fallback: ResolvedSort<TField>
): ResolvedSort<TField> {
  const requestedField = query?.sortBy as TField | undefined;
  const field = requestedField && allowedFields.includes(requestedField) ? requestedField : fallback.field;
  const order = normalizeSortOrder(query?.sortOrder, fallback.order);

  return {
    field,
    order
  };
}

export function buildPaginatedResponse<T, TField extends string>(
  items: T[],
  total: number,
  pagination: PaginationParams,
  sort: ResolvedSort<TField>
): PaginatedResponse<T> {
  return {
    items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
    sortBy: sort.field,
    sortOrder: normalizeSortOrder(sort.order, "desc")
  };
}

function normalizeSortOrder(
  sortOrder: SortOrder | Prisma.SortOrder | undefined,
  fallback: Prisma.SortOrder
): Prisma.SortOrder {
  if (sortOrder === "asc" || sortOrder === "desc") {
    return sortOrder;
  }

  return fallback;
}
