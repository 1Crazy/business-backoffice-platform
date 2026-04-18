/** uploads 相关源码：负责该领域在后端分层中的具体实现。 */
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const PREVIEWABLE_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "text/csv"
] as const;

export const ATTACHMENT_STORAGE_DRIVER_MODES = ["local", "object-storage"] as const;
export type AttachmentStorageDriverMode = (typeof ATTACHMENT_STORAGE_DRIVER_MODES)[number];

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
] as const;
