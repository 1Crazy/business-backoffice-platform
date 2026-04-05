import type { User } from "@/types/access-control";
import type { Customer } from "@/types/customers";
import type { Lead } from "@/types/leads";

export interface Reminder {
  id: string;
  remindAt: string;
  status: "PENDING" | "DONE" | "CANCELLED";
}

export interface ReminderListItem extends Reminder {
  entityType: "LEAD" | "CUSTOMER";
  createdAt: string;
  updatedAt: string;
  owner?: User;
  lead?: Pick<Lead, "id" | "name" | "contactName" | "phone"> | null;
  customer?: Pick<Customer, "id" | "name" | "contactName"> | null;
  followUp?: {
    id: string;
    content: string;
    nextFollowUpAt?: string | null;
  } | null;
}

export interface FollowUp {
  id: string;
  content: string;
  nextFollowUpAt?: string | null;
  createdAt: string;
  createdBy: User;
  reminder?: Reminder | null;
}

export interface FollowUpFormModel {
  content: string;
  nextFollowUpAt: string;
}
