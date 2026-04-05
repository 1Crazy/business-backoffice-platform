import type { User } from "@/types/access-control";
import type { Customer } from "@/types/customers";
import type { FollowUpFormModel } from "@/types/follow-ups";
import type { PaginatedQuery, SortOrder } from "@/types/pagination";
import type { Attachment } from "@/types/uploads";

export interface Lead {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  source?: string | null;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "CLOSED";
  notes?: string | null;
  ownerId: string;
  owner: User;
  convertedCustomerId?: string | null;
  convertedCustomer?: Customer | null;
  attachments?: Attachment[];
}

export interface LeadFilters {
  keyword: string;
  source: string;
  status: string;
  ownerId: string;
}

export interface LeadTableState extends PaginatedQuery {
  total: number;
  totalPages: number;
  sortBy: string;
  sortOrder: SortOrder;
  sortPreset: string;
}

export interface ReminderTableState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LeadFormModel {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  source: string;
  status: Lead["status"];
  ownerId: string;
  notes: string;
}

export interface LeadOwnerFormModel {
  ownerId: string;
}

export interface LeadListQuery extends PaginatedQuery {
  keyword?: string;
  source?: string;
  status?: string;
  ownerId?: string;
}

export interface CreateLeadPayload {
  name: string;
  contactName?: string;
  phone?: string;
  source?: string;
  ownerId: string;
  notes?: string;
}

export interface UpdateLeadPayload {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: string;
  ownerId: string;
  notes?: string | null;
}

export interface TransferLeadOwnerPayload {
  ownerId: string;
}

export interface CreateLeadFollowUpPayload {
  content: string;
  nextFollowUpAt?: string;
}
