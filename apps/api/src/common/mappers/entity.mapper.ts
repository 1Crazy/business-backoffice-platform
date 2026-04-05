import { mapUserSummary } from "./access-control.mapper";
import { toIsoString } from "./date-time.mapper";

interface AttachmentRecord {
  id: string;
  businessType: "CUSTOMER" | "LEAD" | "OTHER";
  businessId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

interface ReminderRecord {
  id: string;
  remindAt: Date;
  status: "PENDING" | "DONE" | "CANCELLED";
}

interface FollowUpCreatedByRecord {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  status: "ACTIVE" | "DISABLED";
  departmentId?: string | null;
}

interface FollowUpRecord {
  id: string;
  content: string;
  nextFollowUpAt?: Date | null;
  createdAt: Date;
  createdBy: FollowUpCreatedByRecord;
  reminder?: ReminderRecord | null;
}

export function mapAttachment(record: AttachmentRecord) {
  return {
    id: record.id,
    businessType: record.businessType,
    businessId: record.businessId,
    fileName: record.fileName,
    originalName: record.originalName,
    mimeType: record.mimeType,
    size: record.size,
    createdAt: toIsoString(record.createdAt)!
  };
}

export function mapReminder(record: ReminderRecord) {
  return {
    id: record.id,
    remindAt: toIsoString(record.remindAt)!,
    status: record.status
  };
}

export function mapFollowUp(record: FollowUpRecord) {
  return {
    id: record.id,
    content: record.content,
    nextFollowUpAt: toIsoString(record.nextFollowUpAt),
    createdAt: toIsoString(record.createdAt)!,
    createdBy: mapUserSummary(record.createdBy),
    reminder: record.reminder ? mapReminder(record.reminder) : null
  };
}
