/** Prisma 基础设施：负责 ORM 客户端的生命周期管理与模块导出。 */
import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    this.$on("beforeExit" as never, async () => {
      await app.close();
    });
  }
}
