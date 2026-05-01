/** 应用健康检查 repository：隔离数据库探活细节，避免 controller 直接接触 ORM。 */
import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class AppHealthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async pingDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
