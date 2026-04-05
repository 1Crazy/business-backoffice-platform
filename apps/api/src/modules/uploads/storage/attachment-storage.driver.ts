import type { Readable } from "stream";

import type { AttachmentStorageProvider } from "@prisma/client";

export interface AttachmentStorageWriteResult {
  storageProvider: AttachmentStorageProvider;
  storageKey: string;
  fileName: string;
}

export interface AttachmentStorageReadResult {
  stream: Readable;
  size?: number;
}

export interface AttachmentStorageDriver {
  store(file: Express.Multer.File): Promise<AttachmentStorageWriteResult>;
  openReadStream(storageKey: string): Promise<AttachmentStorageReadResult>;
  delete(storageKey: string): Promise<void>;
}

export const ATTACHMENT_STORAGE_DRIVER = Symbol("ATTACHMENT_STORAGE_DRIVER");
