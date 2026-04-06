/** 领域类型定义：负责维护当前子域的请求、响应和表单模型契约。 */
import type { User } from "@/types/access-control";
import type { FollowUpFormModel } from "@/types/follow-ups";
import type { PaginatedQuery, SortOrder } from "@/types/pagination";
import type { Attachment } from "@/types/uploads";

export interface CustomerTag {
  id: string;
  name: string;
  color?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status?: string | null;
  notes?: string | null;
  ownerId: string;
  owner: User;
  tags: Array<{
    tag: CustomerTag;
  }>;
  attachments?: Attachment[];
}

export interface CustomerFilters {
  keyword: string;
  source: string;
  status: string;
  ownerId: string;
  tagId: string;
}

export interface CustomerTableState extends PaginatedQuery {
  total: number;
  totalPages: number;
  sortBy: string;
  sortOrder: SortOrder;
  sortPreset: string;
}

export interface CustomerFormModel {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  ownerId: string;
  notes: string;
  tagIds: string[];
}

export interface CustomerTagFormModel {
  name: string;
  color: string;
}

export interface CustomerOwnerFormModel {
  ownerId: string;
}

export interface CustomerListQuery extends PaginatedQuery {
  keyword?: string;
  source?: string;
  status?: string;
  ownerId?: string;
  tagId?: string;
}

export interface CreateCustomerPayload {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  source?: string;
  status?: string;
  ownerId: string;
  notes?: string;
  tagIds?: string[];
}

export interface UpdateCustomerPayload {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status?: string | null;
  ownerId: string;
  notes?: string | null;
  tagIds: string[];
}

export interface CreateCustomerTagPayload {
  name: string;
  color?: string;
}

export interface TransferCustomerOwnerPayload {
  ownerId: string;
}

export interface CreateCustomerFollowUpPayload {
  content: string;
  nextFollowUpAt?: string;
}
