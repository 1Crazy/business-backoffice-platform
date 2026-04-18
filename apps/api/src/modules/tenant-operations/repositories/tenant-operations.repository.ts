import { Injectable } from "@nestjs/common";
import {
  BatchTaskStatus,
  DataScope,
  NotificationDeliveryStatus,
  Prisma,
  RecordStatus,
  UserStatus
} from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const tenantSelect = Prisma.validator<Prisma.TenantSelect>()({
  id: true,
  code: true,
  name: true,
  status: true,
  isDefault: true,
  industry: true,
  planName: true,
  ownerName: true,
  ownerEmail: true,
  ownerPhone: true,
  initializedAt: true,
  disabledAt: true,
  archivedAt: true,
  userQuota: true,
  storageQuotaMb: true,
  monthlyTaskQuota: true,
  createdAt: true,
  updatedAt: true
});

const permissionSelect = Prisma.validator<Prisma.PermissionSelect>()({
  id: true,
  code: true
});

export type TenantRecord = Prisma.TenantGetPayload<{
  select: typeof tenantSelect;
}>;

export type TenantPermissionRecord = Prisma.PermissionGetPayload<{
  select: typeof permissionSelect;
}>;

@Injectable()
export class TenantOperationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listTenants(): Promise<TenantRecord[]> {
    return this.prisma.tenant.findMany({
      select: tenantSelect,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });
  }

  findTenantById(id: string): Promise<TenantRecord> {
    return this.prisma.tenant.findUniqueOrThrow({
      where: { id },
      select: tenantSelect
    });
  }

  listPermissionCatalog(): Promise<TenantPermissionRecord[]> {
    return this.prisma.permission.findMany({
      select: permissionSelect,
      orderBy: [{ appCode: "asc" }, { group: "asc" }, { code: "asc" }]
    });
  }

  createTenantWithInitialization(input: {
    code: string;
    name: string;
    industry?: string;
    planName?: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone?: string;
    userQuota: number;
    storageQuotaMb: number;
    monthlyTaskQuota: number;
    adminUsername: string;
    adminDisplayName: string;
    adminPasswordHash: string;
    permissionIds: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const initializedAt = new Date();
      const tenant = await tx.tenant.create({
        data: {
          code: input.code,
          name: input.name,
          status: RecordStatus.ACTIVE,
          industry: input.industry,
          planName: input.planName,
          ownerName: input.ownerName,
          ownerEmail: input.ownerEmail,
          ownerPhone: input.ownerPhone,
          initializedAt,
          userQuota: input.userQuota,
          storageQuotaMb: input.storageQuotaMb,
          monthlyTaskQuota: input.monthlyTaskQuota
        },
        select: tenantSelect
      });

      const department = await tx.department.create({
        data: {
          tenantId: tenant.id,
          name: `${input.name} 默认组织`,
          code: `tenant-root-${input.code}`,
          status: RecordStatus.ACTIVE
        }
      });

      const role = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: "租户管理员",
          code: `tenant-admin-${input.code}`,
          description: "租户初始化生成的默认管理员角色。",
          isSystem: true,
          dataScope: DataScope.ALL,
          status: RecordStatus.ACTIVE
        }
      });

      if (input.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId
          })),
          skipDuplicates: true
        });
      }

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          username: input.adminUsername,
          passwordHash: input.adminPasswordHash,
          displayName: input.adminDisplayName,
          email: input.ownerEmail,
          phone: input.ownerPhone,
          status: UserStatus.ACTIVE,
          departmentId: department.id
        }
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id
        }
      });

      return tenant;
    });
  }

  updateTenant(
    id: string,
    data: {
      status?: RecordStatus;
      industry?: string | null;
      planName?: string;
      ownerName?: string;
      ownerEmail?: string;
      ownerPhone?: string | null;
      disabledAt?: Date | null;
      archivedAt?: Date | null;
      userQuota?: number;
      storageQuotaMb?: number;
      monthlyTaskQuota?: number;
    }
  ): Promise<TenantRecord> {
    return this.prisma.tenant.update({
      where: { id },
      data,
      select: tenantSelect
    });
  }

  revokeActiveSessionsByTenant(tenantId: string) {
    return this.prisma.userSession.updateMany({
      where: {
        tenantId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  countUsers(tenantId: string, status?: UserStatus) {
    return this.prisma.user.count({
      where: {
        tenantId,
        status
      }
    });
  }

  async sumAttachmentSizeBytes(tenantId: string): Promise<number> {
    const result = await this.prisma.attachment.aggregate({
      where: {
        tenantId
      },
      _sum: {
        size: true
      }
    });

    return result._sum.size ?? 0;
  }

  countBatchTasks(tenantId: string, since: Date) {
    return this.prisma.batchTask.count({
      where: {
        tenantId,
        createdAt: {
          gte: since
        }
      }
    });
  }

  countFailedBatchTasks(tenantId: string, since: Date) {
    return this.prisma.batchTask.count({
      where: {
        tenantId,
        status: BatchTaskStatus.FAILED,
        createdAt: {
          gte: since
        }
      }
    });
  }

  countNotificationDeliveryFailures(tenantId: string, since: Date) {
    return this.prisma.notificationDelivery.count({
      where: {
        status: NotificationDeliveryStatus.FAILED,
        createdAt: {
          gte: since
        },
        notification: {
          tenantId
        }
      }
    });
  }

  async findLatestSessionActivity(tenantId: string): Promise<Date | null> {
    const session = await this.prisma.userSession.findFirst({
      where: {
        tenantId
      },
      orderBy: {
        lastSeenAt: "desc"
      },
      select: {
        lastSeenAt: true
      }
    });

    return session?.lastSeenAt ?? null;
  }
}
