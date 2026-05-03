/** 应用健康检查 repository：隔离数据库探活细节，避免 controller 直接接触 ORM。 */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdirSync } from "fs";
import { join } from "path";

import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class AppHealthRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async pingDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  async pingJobQueue(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  async pingAttachmentStorage(): Promise<void> {
    const mode = (this.configService.get<string>("ATTACHMENT_STORAGE_DRIVER") ?? "local").trim();

    if (mode === "object-storage") {
      const rootDir = process.env.ATTACHMENT_OBJECT_STORAGE_ROOT ?? join(process.cwd(), "object-storage");
      const bucketName = process.env.ATTACHMENT_OBJECT_STORAGE_BUCKET ?? "attachments";
      mkdirSync(join(rootDir, bucketName), { recursive: true });
      return;
    }

    mkdirSync(join(process.cwd(), "uploads"), { recursive: true });
  }

  async getAttachmentScanStatus(): Promise<"ok" | "disabled"> {
    const mode = this.configService.get<string>("ATTACHMENT_SCAN_MODE", "stub").trim().toLowerCase();

    if (mode === "disabled") {
      return "disabled";
    }

    return "ok";
  }
}
