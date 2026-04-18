import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditActionType, GovernanceHealthStatus, RecordStatus, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantQuotasDto } from "./dto/update-tenant-quotas.dto";
import {
  mapTenantOperationsSnapshot,
  type TenantLifecycleStatus
} from "./mappers/tenant-operations.mapper";
import { TenantOperationsRepository, type TenantRecord } from "./repositories/tenant-operations.repository";

const PASSWORD_SALT_ROUNDS = 10;
const TENANT_WARNING_THRESHOLD = 0.8;
const TENANT_ERROR_THRESHOLD = 1;

@Injectable()
export class TenantOperationsService {
  constructor(
    private readonly tenantOperationsRepository: TenantOperationsRepository,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async listTenants() {
    const tenants = await this.tenantOperationsRepository.listTenants();
    return Promise.all(tenants.map((tenant) => this.buildTenantSnapshot(tenant)));
  }

  async createTenant(dto: CreateTenantDto, actor: AuthUser) {
    const permissions = await this.tenantOperationsRepository.listPermissionCatalog();
    const adminPasswordHash = await bcrypt.hash(dto.adminPassword, PASSWORD_SALT_ROUNDS);
    const tenant = await this.tenantOperationsRepository.createTenantWithInitialization({
      code: dto.code.trim(),
      name: dto.name.trim(),
      industry: dto.industry?.trim(),
      planName: dto.planName?.trim(),
      ownerName: dto.ownerName.trim(),
      ownerEmail: dto.ownerEmail.trim(),
      ownerPhone: dto.ownerPhone?.trim(),
      userQuota: dto.userQuota ?? 50,
      storageQuotaMb: dto.storageQuotaMb ?? 5120,
      monthlyTaskQuota: dto.monthlyTaskQuota ?? 10000,
      adminUsername: dto.adminUsername.trim(),
      adminDisplayName: dto.adminDisplayName.trim(),
      adminPasswordHash,
      // 平台运营权限只给平台操作者，初始化出来的租户管理员不应天然具备跨租户入口。
      permissionIds: permissions.filter((item) => !item.code.startsWith("tenant:")).map((item) => item.id)
    });

    await this.auditLogsService.create({
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "tenant",
      targetId: tenant.id,
      detail: {
        code: tenant.code,
        ownerEmail: tenant.ownerEmail
      }
    });

    return this.buildTenantSnapshot(tenant);
  }

  async updateTenantQuotas(id: string, dto: UpdateTenantQuotasDto, actor: AuthUser) {
    const current = await this.tenantOperationsRepository.findTenantById(id);
    this.assertTenantNotArchived(current);

    const updated = await this.tenantOperationsRepository.updateTenant(id, {
      userQuota: dto.userQuota,
      storageQuotaMb: dto.storageQuotaMb,
      monthlyTaskQuota: dto.monthlyTaskQuota
    });

    await this.auditLogsService.create({
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "tenant-quota",
      targetId: updated.id,
      detail: {
        before: {
          userQuota: current.userQuota,
          storageQuotaMb: current.storageQuotaMb,
          monthlyTaskQuota: current.monthlyTaskQuota
        },
        after: {
          userQuota: updated.userQuota,
          storageQuotaMb: updated.storageQuotaMb,
          monthlyTaskQuota: updated.monthlyTaskQuota
        }
      }
    });

    return this.buildTenantSnapshot(updated);
  }

  async enableTenant(id: string, actor: AuthUser) {
    const tenant = await this.tenantOperationsRepository.findTenantById(id);
    this.assertTenantNotArchived(tenant);

    const updated = await this.tenantOperationsRepository.updateTenant(id, {
      status: RecordStatus.ACTIVE,
      disabledAt: null
    });

    await this.auditLogsService.create({
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.ENABLE,
      targetType: "tenant",
      targetId: updated.id
    });

    return this.buildTenantSnapshot(updated);
  }

  async disableTenant(id: string, actor: AuthUser) {
    const tenant = await this.tenantOperationsRepository.findTenantById(id);
    this.assertDefaultTenantMutable(tenant);
    this.assertTenantNotArchived(tenant);

    const updated = await this.tenantOperationsRepository.updateTenant(id, {
      status: RecordStatus.DISABLED,
      disabledAt: new Date()
    });
    await this.tenantOperationsRepository.revokeActiveSessionsByTenant(id);

    await this.auditLogsService.create({
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.DISABLE,
      targetType: "tenant",
      targetId: updated.id
    });

    return this.buildTenantSnapshot(updated);
  }

  async archiveTenant(id: string, actor: AuthUser) {
    const tenant = await this.tenantOperationsRepository.findTenantById(id);
    this.assertDefaultTenantMutable(tenant);
    this.assertTenantNotArchived(tenant);

    const now = new Date();
    const updated = await this.tenantOperationsRepository.updateTenant(id, {
      status: RecordStatus.DISABLED,
      disabledAt: tenant.disabledAt ?? now,
      archivedAt: now
    });
    await this.tenantOperationsRepository.revokeActiveSessionsByTenant(id);

    await this.auditLogsService.create({
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.DISABLE,
      targetType: "tenant-archive",
      targetId: updated.id
    });

    return this.buildTenantSnapshot(updated);
  }

  private async buildTenantSnapshot(tenant: TenantRecord) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const last30Days = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    const last7Days = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const [totalUsers, activeUsers, storageBytes, monthlyTasks, failedTasksLast30Days, notificationFailuresLast7Days, lastActivityAt] =
      await Promise.all([
        this.tenantOperationsRepository.countUsers(tenant.id),
        this.tenantOperationsRepository.countUsers(tenant.id, UserStatus.ACTIVE),
        this.tenantOperationsRepository.sumAttachmentSizeBytes(tenant.id),
        this.tenantOperationsRepository.countBatchTasks(tenant.id, monthStart),
        this.tenantOperationsRepository.countFailedBatchTasks(tenant.id, last30Days),
        this.tenantOperationsRepository.countNotificationDeliveryFailures(tenant.id, last7Days),
        this.tenantOperationsRepository.findLatestSessionActivity(tenant.id)
      ]);

    const storageUsedMb = storageBytes <= 0 ? 0 : Math.ceil(storageBytes / (1024 * 1024));
    const userUsageRate = totalUsers / Math.max(tenant.userQuota, 1);
    const storageUsageRate = storageUsedMb / Math.max(tenant.storageQuotaMb, 1);
    const taskUsageRate = monthlyTasks / Math.max(tenant.monthlyTaskQuota, 1);
    const lifecycleStatus: TenantLifecycleStatus = tenant.archivedAt ? "ARCHIVED" : tenant.status;
    const runtimeHighlights = this.buildRuntimeHighlights({
      tenant,
      totalUsers,
      storageUsedMb,
      monthlyTasks,
      failedTasksLast30Days,
      notificationFailuresLast7Days,
      userUsageRate,
      storageUsageRate,
      taskUsageRate
    });

    return mapTenantOperationsSnapshot(tenant, {
      lifecycleStatus,
      runtimeStatus: this.resolveRuntimeStatus({
        tenant,
        userUsageRate,
        storageUsageRate,
        taskUsageRate,
        failedTasksLast30Days,
        notificationFailuresLast7Days
      }),
      runtimeHighlights,
      usage: {
        totalUsers,
        activeUsers,
        storageUsedMb,
        monthlyTasks,
        failedTasksLast30Days,
        notificationFailuresLast7Days,
        lastActivityAt
      }
    });
  }

  private resolveRuntimeStatus(input: {
    tenant: TenantRecord;
    userUsageRate: number;
    storageUsageRate: number;
    taskUsageRate: number;
    failedTasksLast30Days: number;
    notificationFailuresLast7Days: number;
  }): GovernanceHealthStatus {
    if (input.tenant.archivedAt || input.tenant.status !== RecordStatus.ACTIVE) {
      return GovernanceHealthStatus.WARNING;
    }

    if (
      input.userUsageRate >= TENANT_ERROR_THRESHOLD ||
      input.storageUsageRate >= TENANT_ERROR_THRESHOLD ||
      input.taskUsageRate >= TENANT_ERROR_THRESHOLD ||
      input.failedTasksLast30Days >= 3 ||
      input.notificationFailuresLast7Days >= 3
    ) {
      return GovernanceHealthStatus.ERROR;
    }

    if (
      input.userUsageRate >= TENANT_WARNING_THRESHOLD ||
      input.storageUsageRate >= TENANT_WARNING_THRESHOLD ||
      input.taskUsageRate >= TENANT_WARNING_THRESHOLD ||
      input.failedTasksLast30Days > 0 ||
      input.notificationFailuresLast7Days > 0 ||
      !input.tenant.initializedAt
    ) {
      return GovernanceHealthStatus.WARNING;
    }

    return GovernanceHealthStatus.HEALTHY;
  }

  private buildRuntimeHighlights(input: {
    tenant: TenantRecord;
    totalUsers: number;
    storageUsedMb: number;
    monthlyTasks: number;
    failedTasksLast30Days: number;
    notificationFailuresLast7Days: number;
    userUsageRate: number;
    storageUsageRate: number;
    taskUsageRate: number;
  }) {
    const highlights: string[] = [];

    if (!input.tenant.initializedAt) {
      highlights.push("租户初始化尚未完成。");
    }

    if (input.tenant.archivedAt) {
      highlights.push("租户已归档，仅保留历史审计与运行轨迹。");
    } else if (input.tenant.status !== RecordStatus.ACTIVE) {
      highlights.push("租户已停用，登录与会话访问已阻断。");
    }

    if (input.userUsageRate >= TENANT_ERROR_THRESHOLD) {
      highlights.push(`用户配额已满（${input.totalUsers}/${input.tenant.userQuota}）。`);
    } else if (input.userUsageRate >= TENANT_WARNING_THRESHOLD) {
      highlights.push(`用户配额接近上限（${input.totalUsers}/${input.tenant.userQuota}）。`);
    }

    if (input.storageUsageRate >= TENANT_ERROR_THRESHOLD) {
      highlights.push(`存储配额已满（${input.storageUsedMb}/${input.tenant.storageQuotaMb} MB）。`);
    } else if (input.storageUsageRate >= TENANT_WARNING_THRESHOLD) {
      highlights.push(`存储使用率偏高（${input.storageUsedMb}/${input.tenant.storageQuotaMb} MB）。`);
    }

    if (input.taskUsageRate >= TENANT_ERROR_THRESHOLD) {
      highlights.push(`本月任务额度已满（${input.monthlyTasks}/${input.tenant.monthlyTaskQuota}）。`);
    } else if (input.taskUsageRate >= TENANT_WARNING_THRESHOLD) {
      highlights.push(`本月任务额度接近上限（${input.monthlyTasks}/${input.tenant.monthlyTaskQuota}）。`);
    }

    if (input.failedTasksLast30Days > 0) {
      highlights.push(`近 30 天出现 ${input.failedTasksLast30Days} 个失败批任务。`);
    }

    if (input.notificationFailuresLast7Days > 0) {
      highlights.push(`近 7 天出现 ${input.notificationFailuresLast7Days} 次通知投递失败。`);
    }

    if (highlights.length === 0) {
      highlights.push("租户运行稳定，未发现需要平台介入的异常。");
    }

    return highlights;
  }

  private assertDefaultTenantMutable(tenant: TenantRecord) {
    if (tenant.isDefault) {
      throw new BadRequestException("Default tenant cannot be modified through lifecycle actions.");
    }
  }

  private assertTenantNotArchived(tenant: TenantRecord) {
    if (tenant.archivedAt) {
      throw new BadRequestException("Archived tenant cannot be modified.");
    }
  }
}
