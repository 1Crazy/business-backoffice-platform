import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { AttachmentStorageProvider } from "@prisma/client";

import { ObjectStorageAttachmentStorageDriver } from "../src/modules/uploads/storage/object-storage-attachment-storage.driver";

describe("ObjectStorageAttachmentStorageDriver", () => {
  const previousRoot = process.env.ATTACHMENT_OBJECT_STORAGE_ROOT;
  const previousBucket = process.env.ATTACHMENT_OBJECT_STORAGE_BUCKET;
  const previousPrefix = process.env.ATTACHMENT_OBJECT_STORAGE_PREFIX;

  afterEach(() => {
    if (previousRoot === undefined) {
      delete process.env.ATTACHMENT_OBJECT_STORAGE_ROOT;
    } else {
      process.env.ATTACHMENT_OBJECT_STORAGE_ROOT = previousRoot;
    }

    if (previousBucket === undefined) {
      delete process.env.ATTACHMENT_OBJECT_STORAGE_BUCKET;
    } else {
      process.env.ATTACHMENT_OBJECT_STORAGE_BUCKET = previousBucket;
    }

    if (previousPrefix === undefined) {
      delete process.env.ATTACHMENT_OBJECT_STORAGE_PREFIX;
    } else {
      process.env.ATTACHMENT_OBJECT_STORAGE_PREFIX = previousPrefix;
    }
  });

  it("stores files with object-style keys and can open them again", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "attachment-object-storage-"));
    process.env.ATTACHMENT_OBJECT_STORAGE_ROOT = rootDir;
    process.env.ATTACHMENT_OBJECT_STORAGE_BUCKET = "attachments";
    process.env.ATTACHMENT_OBJECT_STORAGE_PREFIX = "enterprise/prod";

    const driver = new ObjectStorageAttachmentStorageDriver();
    const stored = await driver.store({
      originalname: "contract.pdf",
      buffer: Buffer.from("hello world")
    } as Express.Multer.File);
    const opened = await driver.openReadStream(stored.storageKey);
    const chunks: Buffer[] = [];

    for await (const chunk of opened.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    expect(stored.storageProvider).toBe(AttachmentStorageProvider.OBJECT_STORAGE);
    expect(stored.storageKey).toContain("enterprise/prod/");
    expect(stored.fileName.endsWith(".pdf")).toBe(true);
    expect(opened.size).toBe(11);
    expect(Buffer.concat(chunks).toString()).toBe("hello world");

    await driver.delete(stored.storageKey);
    await expect(driver.openReadStream(stored.storageKey)).rejects.toThrow("Stored attachment content was not found.");

    rmSync(rootDir, { recursive: true, force: true });
  });
});
