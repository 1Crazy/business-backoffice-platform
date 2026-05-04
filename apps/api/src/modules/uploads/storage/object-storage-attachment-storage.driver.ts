/** uploads 模块存储驱动：负责以对象存储键模型承接企业级附件存储。 */
import { randomUUID } from "crypto";
import { createReadStream, mkdirSync } from "fs";
import { promises as fs } from "fs";
import { basename, dirname, extname, join, posix } from "path";

import { Injectable, NotFoundException } from "@nestjs/common";
import { AttachmentStorageProvider } from "@prisma/client";

import type {
  AttachmentStorageDriver,
  AttachmentStorageReadResult,
  AttachmentStorageWriteResult
} from "./attachment-storage.driver";

@Injectable()
export class ObjectStorageAttachmentStorageDriver implements AttachmentStorageDriver {
  private readonly rootDir = process.env.ATTACHMENT_OBJECT_STORAGE_ROOT ?? join(process.cwd(), "object-storage");
  private readonly bucketName = process.env.ATTACHMENT_OBJECT_STORAGE_BUCKET ?? "attachments";
  private readonly keyPrefix = this.normalizePrefix(process.env.ATTACHMENT_OBJECT_STORAGE_PREFIX ?? "business-backoffice");

  constructor() {
    mkdirSync(join(this.rootDir, this.bucketName), { recursive: true });
  }

  async store(file: Express.Multer.File): Promise<AttachmentStorageWriteResult> {
    const extension = extname(file.originalname);
    const now = new Date();
    const storageKey = [
      this.keyPrefix,
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      String(now.getUTCDate()).padStart(2, "0"),
      `${randomUUID()}${extension}`
    ]
      .filter(Boolean)
      .join("/");
    const filePath = this.resolvePath(storageKey);

    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    return {
      storageProvider: AttachmentStorageProvider.OBJECT_STORAGE,
      storageKey,
      fileName: basename(storageKey)
    };
  }

  async openReadStream(storageKey: string): Promise<AttachmentStorageReadResult> {
    const filePath = this.resolvePath(storageKey);

    try {
      const stats = await fs.stat(filePath);

      return {
        stream: createReadStream(filePath),
        size: stats.size
      };
    } catch {
      throw new NotFoundException("附件存储内容不存在。");
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await fs.unlink(this.resolvePath(storageKey));
    } catch {
      return;
    }
  }

  private resolvePath(storageKey: string): string {
    const normalizedKey = storageKey
      .split("/")
      .map((segment) => basename(segment))
      .filter(Boolean)
      .join("/");

    return join(this.rootDir, this.bucketName, ...normalizedKey.split("/"));
  }

  private normalizePrefix(prefix: string): string {
    return prefix
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join(posix.sep);
  }
}
