/** 数据库风险限流 store：通过共享表累计失败次数，避免多实例部署各自计数。 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";
import type { RiskThrottleEntry, RiskThrottleStore } from "../risk-throttle.service";

@Injectable()
export class DatabaseRiskThrottleStore implements RiskThrottleStore {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<RiskThrottleEntry | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        attempts: number;
        firstAttemptAt: Date;
        lockedUntil: Date | null;
      }>
    >(Prisma.sql`
      SELECT "attempts", "firstAttemptAt", "lockedUntil"
      FROM "RiskThrottleEntry"
      WHERE "key" = ${key}
      LIMIT 1
    `);
    const row = rows[0];

    if (!row) {
      return null;
    }

    return {
      attempts: row.attempts,
      firstAttemptAt: row.firstAttemptAt,
      lockedUntil: row.lockedUntil
    };
  }

  async set(key: string, entry: RiskThrottleEntry): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "RiskThrottleEntry" ("key", "attempts", "firstAttemptAt", "lockedUntil", "updatedAt")
      VALUES (${key}, ${entry.attempts}, ${entry.firstAttemptAt}, ${entry.lockedUntil ?? null}, NOW())
      ON CONFLICT ("key") DO UPDATE SET
        "attempts" = EXCLUDED."attempts",
        "firstAttemptAt" = EXCLUDED."firstAttemptAt",
        "lockedUntil" = EXCLUDED."lockedUntil",
        "updatedAt" = NOW()
    `);
  }

  async delete(key: string): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM "RiskThrottleEntry"
      WHERE "key" = ${key}
    `);
  }
}
