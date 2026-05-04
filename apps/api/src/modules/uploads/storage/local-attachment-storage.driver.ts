/** uploads 模块存储驱动：负责抽象或实现底层附件存储能力。 */
import { randomUUID } from "crypto";
import { createReadStream, mkdirSync } from "fs";
import { promises as fs } from "fs";
import { basename, extname, join } from "path";

import { Injectable, NotFoundException } from "@nestjs/common";
import { AttachmentStorageProvider } from "@prisma/client";

import type {
  AttachmentStorageDriver,
  AttachmentStorageReadResult,
  AttachmentStorageWriteResult
} from "./attachment-storage.driver";

@Injectable()
export class LocalAttachmentStorageDriver implements AttachmentStorageDriver {
  private readonly uploadDir = join(process.cwd(), "uploads");

  constructor() {
    mkdirSync(this.uploadDir, { recursive: true });
  }

  async store(file: Express.Multer.File): Promise<AttachmentStorageWriteResult> {
    const extension = extname(basename(file.originalname));
    const storageKey = `${randomUUID()}${extension}`;

    await fs.writeFile(this.resolvePath(storageKey), file.buffer);

    return {
      storageProvider: AttachmentStorageProvider.LOCAL,
      storageKey,
      fileName: storageKey
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
    return join(this.uploadDir, basename(storageKey));
  }
}
