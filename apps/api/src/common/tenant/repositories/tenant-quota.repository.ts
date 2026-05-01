/** 租户配额 repository：负责读取租户配额和当前租户用量，service 只处理业务判定。 */
import { Injectable } from "@nestjs/common";
import { UserStatus } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class TenantQuotaRepository {
  constructor(private readonly prisma: PrismaService) {}

  getTenantQuotas(tenantId: string) {
    return this.prisma.tenant.findUniqueOrThrow({
      where: {
        id: tenantId
      },
      select: {
        userQuota: true,
        storageQuotaMb: true,
        monthlyTaskQuota: true
      }
    });
  }

  countActiveUsers(tenantId: string) {
    return this.prisma.user.count({
      where: {
        tenantId,
        status: UserStatus.ACTIVE
      }
    });
  }

  async sumAttachmentSizeBytes(tenantId: string): Promise<number> {
    const aggregate = await this.prisma.attachment.aggregate({
      where: {
        tenantId
      },
      _sum: {
        size: true
      }
    });

    return aggregate._sum.size ?? 0;
  }

  countBatchTasksSince(tenantId: string, since: Date) {
    return this.prisma.batchTask.count({
      where: {
        tenantId,
        createdAt: {
          gte: since
        }
      }
    });
  }
}
