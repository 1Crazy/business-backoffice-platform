/** system-governance 模块 service：负责系统治理配置、调度任务和相关审计编排。 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException
} from "@nestjs/common";
import {
  AttachmentStorageProvider,
  AuditActionType,
  GovernanceHealthStatus,
  NotificationChannel,
  Prisma,
  SchedulerExecutionStatus,
  SchedulerJobStatus
} from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { NotificationCenterService } from "../notification-center/notification-center.service";
import { UpdateNotificationChannelConfigDto } from "./dto/update-notification-channel-config.dto";
import { UpdateSchedulerJobDto } from "./dto/update-scheduler-job.dto";
import { UpdateStorageConfigDto } from "./dto/update-storage-config.dto";
import {
  mapNotificationChannelConfig,
  mapSchedulerJob,
  mapSchedulerJobExecution,
  mapStorageConfig
} from "./mappers/system-governance.mapper";
import { SystemGovernanceRepository } from "./repositories/system-governance.repository";

@Injectable()
export class SystemGovernanceService {
  constructor(
    private readonly systemGovernanceRepository: SystemGovernanceRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationCenterService: NotificationCenterService
  ) {}

  async listNotificationChannels() {
    await this.ensureNotificationChannelDefaults();
    const channels = await this.systemGovernanceRepository.listNotificationChannelConfigs();
    const recentFailures = await this.systemGovernanceRepository.countRecentNotificationFailures(
      channels.map((item) => item.channel),
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
    );

    return channels.map((item) => mapNotificationChannelConfig(item, recentFailures[item.channel] ?? 0));
  }

  async updateNotificationChannel(adapterCode: string, dto: UpdateNotificationChannelConfigDto, actor: AuthUser) {
    await this.ensureNotificationChannelDefaults();
    const current = (await this.systemGovernanceRepository.listNotificationChannelConfigs()).find(
      (item) => item.adapterCode === adapterCode
    );

    if (!current) {
      throw new BadRequestException("Notification channel configuration was not found.");
    }

    const updated = await this.systemGovernanceRepository.updateNotificationChannelConfig(adapterCode, dto);
    await this.createAuditLog(actor, this.resolveEnableAction(current.isEnabled, updated.isEnabled), "governance-notification-channel", updated.id, {
      adapterCode,
      before: {
        displayName: current.displayName,
        isEnabled: current.isEnabled
      },
      after: {
        displayName: updated.displayName,
        isEnabled: updated.isEnabled
      }
    });

    return mapNotificationChannelConfig(updated, 0);
  }

  async listStorageConfigs() {
    await this.ensureStorageConfigDefaults();
    const configs = await this.systemGovernanceRepository.listStorageConfigs();
    return configs.map((item) => mapStorageConfig(item));
  }

  async updateStorageConfig(code: string, dto: UpdateStorageConfigDto, actor: AuthUser) {
    await this.ensureStorageConfigDefaults();
    const current = await this.systemGovernanceRepository.findStorageConfigByCode(code);
    const updated = await this.systemGovernanceRepository.updateStorageConfig(code, dto);

    await this.createAuditLog(actor, this.resolveEnableAction(current.isEnabled, updated.isEnabled), "governance-storage-config", updated.id, {
      code,
      before: {
        isEnabled: current.isEnabled,
        previewEnabled: current.previewEnabled,
        status: current.status
      },
      after: {
        isEnabled: updated.isEnabled,
        previewEnabled: updated.previewEnabled,
        status: updated.status
      }
    });

    return mapStorageConfig(updated);
  }

  async assertStoragePreviewAllowed(provider: AttachmentStorageProvider) {
    const config = await this.systemGovernanceRepository.findStorageConfigByProvider(provider);

    if (config && (!config.isEnabled || !config.previewEnabled)) {
      throw new ForbiddenException("Attachment preview is disabled for this storage configuration.");
    }
  }

  async listSchedulerJobs() {
    await this.ensureSchedulerJobDefaults();
    const jobs = await this.systemGovernanceRepository.listSchedulerJobs();
    return jobs.map((item) => mapSchedulerJob(item));
  }

  async listSchedulerJobExecutions(code: string) {
    await this.ensureSchedulerJobDefaults();
    const executions = await this.systemGovernanceRepository.listSchedulerJobExecutions(code);
    return executions.map((item) => mapSchedulerJobExecution(item));
  }

  async updateSchedulerJob(code: string, dto: UpdateSchedulerJobDto, actor: AuthUser) {
    await this.ensureSchedulerJobDefaults();
    const current = await this.systemGovernanceRepository.findSchedulerJobByCode(code);
    const nextStatus = dto.status ?? current.status;
    const nextCronExpression = dto.cronExpression ?? current.cronExpression;
    const updated = await this.systemGovernanceRepository.updateSchedulerJob(code, {
      ...dto,
      nextRunAt: nextStatus === SchedulerJobStatus.RUNNING ? this.computeNextRunAt(nextCronExpression) : null
    });

    await this.createAuditLog(actor, this.resolveEnableAction(current.status === SchedulerJobStatus.RUNNING, updated.status === SchedulerJobStatus.RUNNING), "governance-scheduler-job", updated.id, {
      code,
      before: {
        cronExpression: current.cronExpression,
        status: current.status,
        ownerName: current.ownerName
      },
      after: {
        cronExpression: updated.cronExpression,
        status: updated.status,
        ownerName: updated.ownerName
      }
    });

    return mapSchedulerJob(updated);
  }

  async runSchedulerJob(code: string, actor: AuthUser) {
    await this.ensureSchedulerJobDefaults();
    const job = await this.systemGovernanceRepository.findSchedulerJobByCode(code);

    if (job.status !== SchedulerJobStatus.RUNNING) {
      throw new BadRequestException("Scheduler job is paused and cannot be executed.");
    }

    const startedAt = new Date();
    const execution = await this.systemGovernanceRepository.createSchedulerJobExecution({
      jobId: job.id,
      status: SchedulerExecutionStatus.RUNNING,
      startedAt
    });

    try {
      const summary = await this.executeSchedulerJob(job.code);
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();
      const completedExecution = await this.systemGovernanceRepository.updateSchedulerJobExecution(execution.id, {
        status: SchedulerExecutionStatus.SUCCEEDED,
        summary,
        finishedAt,
        durationMs
      });

      await this.systemGovernanceRepository.updateSchedulerJob(code, {
        lastRunAt: finishedAt,
        lastExecutionStatus: SchedulerExecutionStatus.SUCCEEDED,
        lastErrorMessage: null,
        nextRunAt: this.computeNextRunAt(job.cronExpression, finishedAt)
      });

      await this.createAuditLog(actor, AuditActionType.CREATE, "governance-scheduler-execution", completedExecution.id, {
        code,
        status: SchedulerExecutionStatus.SUCCEEDED,
        summary
      });

      return mapSchedulerJobExecution(completedExecution);
    } catch (error) {
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();
      const message = error instanceof Error ? error.message : "Scheduler job execution failed.";
      const failedExecution = await this.systemGovernanceRepository.updateSchedulerJobExecution(execution.id, {
        status: SchedulerExecutionStatus.FAILED,
        errorMessage: message,
        finishedAt,
        durationMs
      });

      await this.systemGovernanceRepository.updateSchedulerJob(code, {
        lastRunAt: finishedAt,
        lastExecutionStatus: SchedulerExecutionStatus.FAILED,
        lastErrorMessage: message,
        nextRunAt: this.computeNextRunAt(job.cronExpression, finishedAt)
      });

      await this.createAuditLog(actor, AuditActionType.CREATE, "governance-scheduler-execution", failedExecution.id, {
        code,
        status: SchedulerExecutionStatus.FAILED,
        errorMessage: message
      });
      await this.publishGovernanceFailureAlert(job.displayName, actor, message);

      throw new InternalServerErrorException(message);
    }
  }

  private async executeSchedulerJob(code: string) {
    if (code === "renewal-reminder-push") {
      const count = await this.systemGovernanceRepository.countPendingRenewalReminders(
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      );
      return `扫描到 ${count} 条待跟进续费提醒。`;
    }

    if (code === "overdue-payment-scan") {
      const count = await this.systemGovernanceRepository.countOverduePaymentPlans(new Date());
      return `扫描到 ${count} 条逾期或部分回款计划。`;
    }

    if (code === "nightly-export-archive") {
      const count = await this.systemGovernanceRepository.countArchivableBatchTasks(
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
      );
      return `识别出 ${count} 条可归档批处理记录。`;
    }

    throw new BadRequestException("Unsupported scheduler job code.");
  }

  private async publishGovernanceFailureAlert(jobName: string, actor: AuthUser, message: string) {
    await this.notificationCenterService.publishEvent({
      event: {
        eventType: "GOVERNANCE_ALERT",
        domain: "PLATFORM",
        sourceType: "scheduler-job",
        sourceId: jobName,
        title: `${jobName} 执行失败`,
        summary: message,
        priority: "HIGH",
        payload: {
          jobName,
          errorMessage: message
        },
        targetPath: "/system",
        targetLabel: "查看系统治理",
        actorId: actor.id,
        occurredAt: new Date()
      },
      recipientIds: [actor.id]
    });
  }

  private async ensureNotificationChannelDefaults() {
    await this.systemGovernanceRepository.ensureNotificationChannelConfigs([
      {
        channel: NotificationChannel.IN_APP,
        adapterCode: "in-app-default",
        provider: "internal",
        displayName: "站内消息",
        description: "系统内置消息中心渠道。",
        isEnabled: true,
        config: {
          fallbackChannel: null
        },
        capabilities: {
          routeScope: "默认",
          fallbackChannel: "无"
        }
      },
      {
        channel: NotificationChannel.EMAIL,
        adapterCode: "smtp-default",
        provider: "smtp",
        displayName: "邮件通知",
        description: "审批结果与催办升级默认通过邮件补充投递。",
        isEnabled: true,
        config: {
          fallbackChannel: "IN_APP"
        },
        capabilities: {
          routeScope: "审批结果 / 催办升级",
          fallbackChannel: "站内消息"
        }
      },
      {
        channel: NotificationChannel.ENTERPRISE_IM,
        adapterCode: "enterprise-im-default",
        provider: "wecom",
        displayName: "企业 IM",
        description: "高优先消息的企业即时通信通道。",
        isEnabled: false,
        config: {
          fallbackChannel: "EMAIL"
        },
        capabilities: {
          routeScope: "高优先通知",
          fallbackChannel: "邮件通知"
        }
      }
    ]);
  }

  private async ensureStorageConfigDefaults() {
    const objectStorageEnabled = (process.env.ATTACHMENT_STORAGE_DRIVER ?? "local").trim() === "object-storage";
    await this.systemGovernanceRepository.ensureStorageConfigs([
      {
        code: "storage-local-preview",
        displayName: "本地预览存储",
        provider: AttachmentStorageProvider.LOCAL,
        isEnabled: !objectStorageEnabled,
        status: GovernanceHealthStatus.HEALTHY,
        bucketName: "/uploads",
        regionLabel: "本机节点",
        previewEnabled: true,
        config: {
          driverMode: "local"
        }
      },
      {
        code: "storage-object-primary",
        displayName: "主对象存储",
        provider: AttachmentStorageProvider.OBJECT_STORAGE,
        isEnabled: objectStorageEnabled,
        status: process.env.ATTACHMENT_OBJECT_STORAGE_BUCKET ? GovernanceHealthStatus.HEALTHY : GovernanceHealthStatus.WARNING,
        bucketName: process.env.ATTACHMENT_OBJECT_STORAGE_BUCKET ?? "merchant-docs-prod",
        regionLabel: process.env.ATTACHMENT_OBJECT_STORAGE_REGION ?? "华东 1",
        previewEnabled: true,
        config: {
          driverMode: "object-storage"
        }
      }
    ]);
  }

  private async ensureSchedulerJobDefaults() {
    const now = new Date();
    await this.systemGovernanceRepository.ensureSchedulerJobs([
      {
        code: "renewal-reminder-push",
        displayName: "续费提醒推送",
        description: "扫描续费窗口内的合同并生成跟进提醒。",
        cronExpression: "0 */2 * * *",
        status: SchedulerJobStatus.RUNNING,
        ownerName: "经营平台",
        nextRunAt: this.computeNextRunAt("0 */2 * * *", now)
      },
      {
        code: "overdue-payment-scan",
        displayName: "逾期回款扫描",
        description: "巡检逾期与部分到账的回款计划。",
        cronExpression: "0 9 * * *",
        status: SchedulerJobStatus.RUNNING,
        ownerName: "收入运营",
        nextRunAt: this.computeNextRunAt("0 9 * * *", now)
      },
      {
        code: "nightly-export-archive",
        displayName: "导出归档清理",
        description: "夜间清点过期导出结果和失败明细。",
        cronExpression: "30 2 * * *",
        status: SchedulerJobStatus.PAUSED,
        ownerName: "平台治理",
        nextRunAt: null
      }
    ]);
  }

  private resolveEnableAction(previousEnabled: boolean, nextEnabled: boolean) {
    if (previousEnabled !== nextEnabled) {
      return nextEnabled ? AuditActionType.ENABLE : AuditActionType.DISABLE;
    }

    return AuditActionType.UPDATE;
  }

  private async createAuditLog(
    actor: AuthUser,
    actionType: AuditActionType,
    targetType: string,
    targetId: string,
    detail: Record<string, unknown>
  ) {
    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType,
      targetType,
      targetId,
      detail: detail as Prisma.InputJsonObject
    });
  }

  private computeNextRunAt(cronExpression: string, referenceAt = new Date()) {
    const segments = cronExpression.trim().split(/\s+/);

    if (segments.length !== 5) {
      return null;
    }

    const [minuteSegment, hourSegment] = segments;
    const minute = Number.parseInt(minuteSegment, 10);

    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      return null;
    }

    if (/^\d+$/.test(hourSegment)) {
      const hour = Number.parseInt(hourSegment, 10);

      if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        return null;
      }

      const nextRun = new Date(referenceAt);
      nextRun.setSeconds(0, 0);
      nextRun.setHours(hour, minute, 0, 0);

      if (nextRun.getTime() <= referenceAt.getTime()) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      return nextRun;
    }

    const intervalMatch = hourSegment.match(/^\*\/(\d{1,2})$/);

    if (!intervalMatch) {
      return null;
    }

    const intervalHours = Number.parseInt(intervalMatch[1], 10);

    if (!Number.isInteger(intervalHours) || intervalHours <= 0) {
      return null;
    }

    const nextRun = new Date(referenceAt);
    nextRun.setSeconds(0, 0);
    nextRun.setMinutes(minute, 0, 0);

    while (nextRun.getTime() <= referenceAt.getTime() || nextRun.getHours() % intervalHours !== 0) {
      nextRun.setHours(nextRun.getHours() + 1);
    }

    return nextRun;
  }
}
