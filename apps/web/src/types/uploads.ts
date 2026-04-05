export type RecordBusinessType = "CUSTOMER" | "LEAD" | "OTHER";

export interface Attachment {
  id: string;
  businessType: RecordBusinessType;
  businessId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface AttachmentQuery {
  businessType: Extract<RecordBusinessType, "CUSTOMER" | "LEAD">;
  businessId: string;
}

export interface AttachmentUploadPayload extends AttachmentQuery {
  file: File | Blob;
}
