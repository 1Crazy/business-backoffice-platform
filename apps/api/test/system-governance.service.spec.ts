import {
  AttachmentStorageProvider,
  GovernanceHealthStatus,
  NotificationChannel,
  SchedulerExecutionStatus,
  SchedulerJobStatus
} from "@prisma/client";

import { SystemGovernanceService } from "../src/modules/system-governance/system-governance.service";

function buildActor(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    username: "admin",
    displayName: "系统管理员",
    roleCodes: ["super-admin"],
    permissions: ["dictionary:read", "dictionary:write"],
    ...overrides
  } as any;
}

describe("SystemGovernanceService", () => {
  const repository = {
    ensureNotificationChannelConfigs: jest.fn(),
    listNotificationChannelConfigs: jest.fn(),
    countRecentNotificationFailures: jest.fn(),
    updateNotificationChannelConfig: jest.fn(),
    ensureStorageConfigs: jest.fn(),
    listStorageConfigs: jest.fn(),
    findStorageConfigByCode: jest.fn(),
    findStorageConfigByProvider: jest.fn(),
    updateStorageConfig: jest.fn(),
    ensureSchedulerJobs: jest.fn(),
    listSchedulerJobs: jest.fn(),
    findSchedulerJobByCode: jest.fn(),
    updateSchedulerJob: jest.fn(),
    createSchedulerJobExecution: jest.fn(),
    updateSchedulerJobExecution: jest.fn(),
    listSchedulerJobExecutions: jest.fn(),
    countPendingRenewalReminders: jest.fn(),
    countOverduePaymentPlans: jest.fn(),
    countArchivableBatchTasks: jest.fn()
  };
  const auditLogsService = {
    create: jest.fn().mockResolvedValue(undefined)
  };
  const notificationCenterService = {
    publishEvent: jest.fn().mockResolvedValue(undefined)
  };
  const service = new SystemGovernanceService(repository as any, auditLogsService as any, notificationCenterService as any);

  beforeEach(() => {
    jest.clearAllMocks();
    repository.ensureNotificationChannelConfigs.mockResolvedValue([]);
    repository.ensureStorageConfigs.mockResolvedValue([]);
    repository.ensureSchedulerJobs.mockResolvedValue([]);
  });

  it("lists notification channel governance items with recent failure counts", async () => {
    repository.listNotificationChannelConfigs.mockResolvedValue([
      {
        id: "channel-email",
        channel: NotificationChannel.EMAIL,
        adapterCode: "smtp-default",
        provider: "smtp",
        displayName: "邮件通知",
        description: null,
        isEnabled: true,
        config: {
          fallbackChannel: "IN_APP"
        },
        capabilities: {
          routeScope: "审批结果 / 催办升级"
        },
        createdAt: new Date("2026-04-16T08:00:00.000Z"),
        updatedAt: new Date("2026-04-16T08:30:00.000Z")
      }
    ]);
    repository.countRecentNotificationFailures.mockResolvedValue({
      IN_APP: 0,
      EMAIL: 2,
      ENTERPRISE_IM: 0
    });

    const result = await service.listNotificationChannels();

    expect(repository.ensureNotificationChannelConfigs).toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({
        adapterCode: "smtp-default",
        status: "WARNING",
        recentFailures: 2,
        fallbackChannel: "IN_APP"
      })
    ]);
  });

  it("updates storage config and records audit history", async () => {
    repository.findStorageConfigByCode.mockResolvedValue({
      id: "storage-object-primary",
      code: "storage-object-primary",
      displayName: "主对象存储",
      provider: AttachmentStorageProvider.OBJECT_STORAGE,
      isEnabled: true,
      status: GovernanceHealthStatus.WARNING,
      bucketName: "merchant-docs-prod",
      regionLabel: "华东 1",
      previewEnabled: true,
      config: null,
      createdAt: new Date("2026-04-16T08:00:00.000Z"),
      updatedAt: new Date("2026-04-16T08:30:00.000Z")
    });
    repository.updateStorageConfig.mockResolvedValue({
      id: "storage-object-primary",
      code: "storage-object-primary",
      displayName: "主对象存储",
      provider: AttachmentStorageProvider.OBJECT_STORAGE,
      isEnabled: false,
      status: GovernanceHealthStatus.WARNING,
      bucketName: "merchant-docs-prod",
      regionLabel: "华东 1",
      previewEnabled: false,
      config: null,
      createdAt: new Date("2026-04-16T08:00:00.000Z"),
      updatedAt: new Date("2026-04-16T09:00:00.000Z")
    });

    const result = await service.updateStorageConfig(
      "storage-object-primary",
      {
        isEnabled: false,
        previewEnabled: false
      },
      buildActor()
    );

    expect(repository.updateStorageConfig).toHaveBeenCalledWith("storage-object-primary", {
      isEnabled: false,
      previewEnabled: false
    });
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "DISABLE",
        targetType: "governance-storage-config"
      })
    );
    expect(result).toMatchObject({
      code: "storage-object-primary",
      isEnabled: false,
      previewEnabled: false
    });
  });

  it("updates scheduler jobs and records pause audits", async () => {
    repository.findSchedulerJobByCode.mockResolvedValue({
      id: "job-archive",
      code: "nightly-export-archive",
      displayName: "导出归档清理",
      description: "夜间清理导出文件",
      cronExpression: "30 2 * * *",
      status: SchedulerJobStatus.RUNNING,
      ownerName: "平台治理",
      nextRunAt: new Date("2026-04-17T02:30:00.000Z"),
      lastRunAt: null,
      lastExecutionStatus: null,
      lastErrorMessage: null,
      createdAt: new Date("2026-04-16T08:00:00.000Z"),
      updatedAt: new Date("2026-04-16T08:00:00.000Z")
    });
    repository.updateSchedulerJob.mockResolvedValue({
      id: "job-archive",
      code: "nightly-export-archive",
      displayName: "导出归档清理",
      description: "夜间清理导出文件",
      cronExpression: "30 2 * * *",
      status: SchedulerJobStatus.PAUSED,
      ownerName: "平台治理",
      nextRunAt: null,
      lastRunAt: null,
      lastExecutionStatus: null,
      lastErrorMessage: null,
      createdAt: new Date("2026-04-16T08:00:00.000Z"),
      updatedAt: new Date("2026-04-16T09:30:00.000Z")
    });

    const result = await service.updateSchedulerJob(
      "nightly-export-archive",
      {
        status: SchedulerJobStatus.PAUSED
      },
      buildActor()
    );

    expect(repository.updateSchedulerJob).toHaveBeenCalledWith(
      "nightly-export-archive",
      expect.objectContaining({
        status: SchedulerJobStatus.PAUSED,
        nextRunAt: null
      })
    );
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "DISABLE",
        targetType: "governance-scheduler-job"
      })
    );
    expect(result).toMatchObject({
      code: "nightly-export-archive",
      status: SchedulerJobStatus.PAUSED
    });
  });

  it("runs scheduler jobs successfully and stores execution records", async () => {
    repository.findSchedulerJobByCode.mockResolvedValue({
      id: "job-renewal",
      code: "renewal-reminder-push",
      displayName: "续费提醒推送",
      description: "续费提醒",
      cronExpression: "0 */2 * * *",
      status: SchedulerJobStatus.RUNNING,
      ownerName: "经营平台",
      nextRunAt: new Date("2026-04-16T10:00:00.000Z"),
      lastRunAt: null,
      lastExecutionStatus: null,
      lastErrorMessage: null,
      createdAt: new Date("2026-04-16T08:00:00.000Z"),
      updatedAt: new Date("2026-04-16T08:00:00.000Z")
    });
    repository.createSchedulerJobExecution.mockResolvedValue({
      id: "execution-1",
      jobId: "job-renewal",
      status: SchedulerExecutionStatus.RUNNING,
      summary: null,
      errorMessage: null,
      startedAt: new Date("2026-04-16T08:30:00.000Z"),
      finishedAt: null,
      durationMs: null,
      createdAt: new Date("2026-04-16T08:30:00.000Z")
    });
    repository.countPendingRenewalReminders.mockResolvedValue(4);
    repository.updateSchedulerJobExecution.mockResolvedValue({
      id: "execution-1",
      jobId: "job-renewal",
      status: SchedulerExecutionStatus.SUCCEEDED,
      summary: "扫描到 4 条待跟进续费提醒。",
      errorMessage: null,
      startedAt: new Date("2026-04-16T08:30:00.000Z"),
      finishedAt: new Date("2026-04-16T08:30:02.000Z"),
      durationMs: 2000,
      createdAt: new Date("2026-04-16T08:30:00.000Z")
    });
    repository.updateSchedulerJob.mockResolvedValue(undefined);

    const result = await service.runSchedulerJob("renewal-reminder-push", buildActor());

    expect(repository.countPendingRenewalReminders).toHaveBeenCalled();
    expect(repository.updateSchedulerJobExecution).toHaveBeenCalledWith(
      "execution-1",
      expect.objectContaining({
        status: SchedulerExecutionStatus.SUCCEEDED,
        summary: "扫描到 4 条待跟进续费提醒。"
      })
    );
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "CREATE",
        targetType: "governance-scheduler-execution"
      })
    );
    expect(result).toMatchObject({
      id: "execution-1",
      status: SchedulerExecutionStatus.SUCCEEDED
    });
  });

  it("publishes governance alerts when scheduler job execution fails", async () => {
    repository.findSchedulerJobByCode.mockResolvedValue({
      id: "job-overdue",
      code: "overdue-payment-scan",
      displayName: "逾期回款扫描",
      description: "逾期回款扫描",
      cronExpression: "0 9 * * *",
      status: SchedulerJobStatus.RUNNING,
      ownerName: "收入运营",
      nextRunAt: new Date("2026-04-17T09:00:00.000Z"),
      lastRunAt: null,
      lastExecutionStatus: null,
      lastErrorMessage: null,
      createdAt: new Date("2026-04-16T08:00:00.000Z"),
      updatedAt: new Date("2026-04-16T08:00:00.000Z")
    });
    repository.createSchedulerJobExecution.mockResolvedValue({
      id: "execution-2",
      jobId: "job-overdue",
      status: SchedulerExecutionStatus.RUNNING,
      summary: null,
      errorMessage: null,
      startedAt: new Date("2026-04-16T09:00:00.000Z"),
      finishedAt: null,
      durationMs: null,
      createdAt: new Date("2026-04-16T09:00:00.000Z")
    });
    repository.countOverduePaymentPlans.mockRejectedValue(new Error("Database timeout"));
    repository.updateSchedulerJobExecution.mockResolvedValue({
      id: "execution-2",
      jobId: "job-overdue",
      status: SchedulerExecutionStatus.FAILED,
      summary: null,
      errorMessage: "Database timeout",
      startedAt: new Date("2026-04-16T09:00:00.000Z"),
      finishedAt: new Date("2026-04-16T09:00:01.000Z"),
      durationMs: 1000,
      createdAt: new Date("2026-04-16T09:00:00.000Z")
    });
    repository.updateSchedulerJob.mockResolvedValue(undefined);

    await expect(service.runSchedulerJob("overdue-payment-scan", buildActor())).rejects.toThrow("Database timeout");

    expect(notificationCenterService.publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          eventType: "GOVERNANCE_ALERT",
          title: "逾期回款扫描 执行失败"
        }),
        recipientIds: ["user-1"]
      })
    );
    expect(repository.updateSchedulerJobExecution).toHaveBeenCalledWith(
      "execution-2",
      expect.objectContaining({
        status: SchedulerExecutionStatus.FAILED,
        errorMessage: "Database timeout"
      })
    );
  });
});
