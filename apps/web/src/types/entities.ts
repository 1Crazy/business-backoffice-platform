export interface Department {
  id: string;
  name: string;
  code: string;
  status: "ACTIVE" | "DISABLED";
  parentId?: string | null;
  parent?: Department | null;
}

export interface PermissionItem {
  id: string;
  name: string;
  code: string;
  group: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: "ACTIVE" | "DISABLED";
  permissions: Array<{
    permission: PermissionItem;
  }>;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  status: "ACTIVE" | "DISABLED";
  departmentId?: string | null;
  department?: Department | null;
  roles: Array<{
    role: Role;
  }>;
}

export interface CustomerTag {
  id: string;
  name: string;
  color?: string | null;
}

export interface Attachment {
  id: string;
  businessType: "CUSTOMER" | "LEAD" | "OTHER";
  businessId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
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

export interface Reminder {
  id: string;
  remindAt: string;
  status: "PENDING" | "DONE" | "CANCELLED";
}

export interface FollowUp {
  id: string;
  content: string;
  nextFollowUpAt?: string | null;
  createdAt: string;
  createdBy: User;
  reminder?: Reminder | null;
}

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

export interface DictionaryEntry {
  id: string;
  type: string;
  label: string;
  value: string;
  sort: number;
  enabled: boolean;
}

export interface AuditLog {
  id: string;
  actorName?: string | null;
  actionType: string;
  targetType: string;
  targetId?: string | null;
  createdAt: string;
}

export interface DashboardOverview {
  startDate: string;
  endDate: string;
  newCustomers: number;
  followUpCount: number;
  convertedLeads: number;
  totalLeads: number;
  conversionRate: number;
  pendingReminders: number;
}

