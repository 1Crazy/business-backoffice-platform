/** Prisma 基础设施：负责 ORM 客户端的生命周期管理与模块导出。 */
import { Global, Module } from "@nestjs/common";

import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}

