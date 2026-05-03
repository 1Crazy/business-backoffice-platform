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
    ensureNotificationChannelConfigs: vi.fn(),
    listNotificationChannelConfigs: vi.fn(),
    countRecentNotificationFailures: vi.fn(),
    updateNotificationChannelConfig: vi.fn(),
    ensureStorageConfigs: vi.fn(),
    listStorageConfigs: vi.fn(),
    findStorageConfigByCode: vi.fn(),
    findStorageConfigByProvider: vi.fn(),
    updateStorageConfig: vi.fn(),
    ensureSchedulerJobs: vi.fn(),
    listSchedulerJobs: vi.fn(),
    listDueSchedulerJobs: vi.fn(),
    findSchedulerJobByCode: vi.fn(),
    updateSchedulerJob: vi.fn(),
    createSchedulerJobExecution: vi.fn(),
    updateSchedulerJobExecution: vi.fn(),
    listSchedulerJobExecutions: vi.fn(),
    countPendingRenewalReminders: vi.fn(),
    countOverduePaymentPlans: vi.fn(),
    countArchivableBatchTasks: vi.fn(),
    purgeRetentionData: vi.fn(),
    exportPersonalData: vi.fn(),
    anonymizeUser: vi.fn()
  };
  const auditLogsService = {
    create: vi.fn().mockResolvedValue(undefined)
  };
  const notificationCenterService = {
    publishEvent: vi.fn().mockResolvedValue(undefined)
  };
  const openIntegrationService = {
    dispatchBusinessWebhookEvent: vi.fn().mockResolvedValue(undefined)
  };
  const jobQueueService = {
    registerHandler: vi.fn(),
    enqueue: vi.fn().mockResolvedValue({}),
    scheduleRun: vi.fn()
  };
  const service = new SystemGovernanceService(
    repository as any,
    auditLogsService as any,
    notificationCenterService as any,
    openIntegrationService as any,
    jobQueueService as any
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    repository.ensureNotificationChannelConfigs.mockResolvedValue([]);
    repository.ensureStorageConfigs.mockResolvedValue([]);
    repository.ensureSchedulerJobs.mockResolvedValue([]);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.useRealTimers();
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

    expect(jobQueueService.registerHandler).toHaveBeenCalledWith("system-governance.scheduler-run", expect.any(Function));
    expect(jobQueueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "system-governance.scheduler-run",
        correlationId: "execution-1"
      })
    );
    expect(jobQueueService.scheduleRun).toHaveBeenCalledWith(["system-governance.scheduler-run"]);

    const handler = jobQueueService.registerHandler.mock.calls.find((call) => call[0] === "system-governance.scheduler-run")?.[1];
    expect(result).toMatchObject({
      id: "execution-1",
      status: SchedulerExecutionStatus.RUNNING
    });
    await handler({
      payload: jobQueueService.enqueue.mock.calls[0][0].payload,
      startedAt: new Date("2026-04-16T08:30:00.000Z")
    });

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
  });

  it("runs data retention cleanup and stores execution summary", async () => {
    repository.findSchedulerJobByCode.mockResolvedValue({
      id: "job-retention",
      code: "data-retention-cleanup",
      displayName: "数据保留清理",
      description: "清理过期记录",
      cronExpression: "0 3 * * *",
      status: SchedulerJobStatus.RUNNING,
      ownerName: "平台治理",
      nextRunAt: new Date("2026-04-17T03:00:00.000Z"),
      lastRunAt: null,
      lastExecutionStatus: null,
      lastErrorMessage: null,
      createdAt: new Date("2026-04-16T08:00:00.000Z"),
      updatedAt: new Date("2026-04-16T08:00:00.000Z")
    });
    repository.createSchedulerJobExecution.mockResolvedValue({
      id: "execution-retention-1",
      jobId: "job-retention",
      status: SchedulerExecutionStatus.RUNNING,
      summary: null,
      errorMessage: null,
      startedAt: new Date("2026-04-16T03:00:00.000Z"),
      finishedAt: null,
      durationMs: null,
      createdAt: new Date("2026-04-16T03:00:00.000Z")
    });
    repository.purgeRetentionData.mockResolvedValue({
      auditLogsDeleted: 10,
      notificationsDeleted: 5,
      webhookDeliveriesDeleted: 3,
      revokedSessionsDeleted: 2,
      batchTaskFailuresDeleted: 1
    });
    repository.updateSchedulerJobExecution.mockResolvedValue({
      id: "execution-retention-1",
      jobId: "job-retention",
      status: SchedulerExecutionStatus.SUCCEEDED,
      summary: "清理审计日志 10 条，通知 5 条，Webhook 投递 3 条，已撤销会话 2 条，失败明细 1 条。",
      errorMessage: null,
      startedAt: new Date("2026-04-16T03:00:00.000Z"),
      finishedAt: new Date("2026-04-16T03:00:02.000Z"),
      durationMs: 2000,
      createdAt: new Date("2026-04-16T03:00:00.000Z")
    });
    repository.updateSchedulerJob.mockResolvedValue(undefined);

    const result = await service.runSchedulerJob("data-retention-cleanup", buildActor());
    const handler = jobQueueService.registerHandler.mock.calls.find((call) => call[0] === "system-governance.scheduler-run")?.[1];
    await handler({
      payload: jobQueueService.enqueue.mock.calls[0][0].payload,
      startedAt: new Date("2026-04-16T03:00:00.000Z")
    });

    expect(repository.purgeRetentionData).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: "execution-retention-1",
      status: SchedulerExecutionStatus.RUNNING
    });
    expect(repository.updateSchedulerJobExecution).toHaveBeenCalledWith(
      "execution-retention-1",
      expect.objectContaining({
        status: SchedulerExecutionStatus.SUCCEEDED,
        summary: expect.stringContaining("清理审计日志 10 条")
      })
    );
  });

  it("registers data retention cleanup as a default scheduler job", async () => {
    repository.listSchedulerJobs.mockResolvedValue([]);

    await service.listSchedulerJobs();

    expect(repository.ensureSchedulerJobs).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          code: "data-retention-cleanup",
          cronExpression: "0 3 * * *",
          status: SchedulerJobStatus.RUNNING
        })
      ])
    );
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

    await service.runSchedulerJob("overdue-payment-scan", buildActor());
    const handler = jobQueueService.registerHandler.mock.calls.find((call) => call[0] === "system-governance.scheduler-run")?.[1];
    await expect(
      handler({
        payload: jobQueueService.enqueue.mock.calls[0][0].payload,
        startedAt: new Date("2026-04-16T09:00:00.000Z")
      })
    ).rejects.toThrow("Database timeout");

    expect(notificationCenterService.publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          eventType: "GOVERNANCE_ALERT",
          title: "逾期回款扫描 执行失败"
        }),
        recipientIds: ["user-1"]
      })
    );
    expect(openIntegrationService.dispatchBusinessWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "GOVERNANCE_ALERT",
        sourceType: "scheduler-job",
        sourceId: "逾期回款扫描"
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

  it("enqueues due scheduler jobs for the worker runner", async () => {
    repository.listDueSchedulerJobs = vi.fn().mockResolvedValue([
      {
        id: "job-renewal",
        code: "renewal-reminder-push"
      },
      {
        id: "job-overdue",
        code: "overdue-payment-scan"
      }
    ]);
    repository.createSchedulerJobExecution
      .mockResolvedValueOnce({
        id: "execution-10",
        jobId: "job-renewal",
        status: SchedulerExecutionStatus.RUNNING,
        startedAt: new Date("2026-04-16T10:00:00.000Z")
      })
      .mockResolvedValueOnce({
        id: "execution-11",
        jobId: "job-overdue",
        status: SchedulerExecutionStatus.RUNNING,
        startedAt: new Date("2026-04-16T10:00:00.000Z")
      });

    const result = await service.enqueueDueSchedulerJobs();

    expect(repository.listDueSchedulerJobs).toHaveBeenCalled();
    expect(jobQueueService.enqueue).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "system-governance.scheduler-run",
        correlationId: "execution-10"
      })
    );
    expect(jobQueueService.enqueue).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "system-governance.scheduler-run",
        correlationId: "execution-11"
      })
    );
    expect(jobQueueService.scheduleRun).toHaveBeenCalledWith(["system-governance.scheduler-run"]);
    expect(result).toEqual({ enqueued: 2 });
  });

  it("starts a scheduler poller that periodically enqueues due jobs", async () => {
    repository.listDueSchedulerJobs.mockResolvedValue([]);

    await vi.advanceTimersByTimeAsync(60_000);

    expect(repository.listDueSchedulerJobs).toHaveBeenCalled();
  });

  it("exports personal data with audited metadata", async () => {
    repository.exportPersonalData.mockResolvedValue({
      user: {
        id: "user-2",
        tenantId: "tenant-1",
        username: "bob",
        displayName: "Bob",
        email: "bob@example.com",
        phone: "13800000000",
        status: "ACTIVE",
        departmentId: "dept-1",
        createdAt: new Date("2026-04-16T08:00:00.000Z"),
        updatedAt: new Date("2026-04-16T08:00:00.000Z")
      },
      customers: [{ id: "customer-1" }],
      leads: [{ id: "lead-1" }],
      notifications: [{ id: "notification-1" }],
      auditLogs: [{ id: "audit-1" }]
    });

    const result = await service.exportPersonalData("user-2", buildActor({ tenantId: "tenant-1" }));

    expect(repository.exportPersonalData).toHaveBeenCalledWith("user-2");
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "personal-data-export",
        targetId: "user-2"
      })
    );
    expect(result.exportMeta).toEqual(
      expect.objectContaining({
        customers: 1,
        leads: 1,
        notifications: 1,
        auditLogs: 1
      })
    );
  });

  it("anonymizes personal data with audit trail", async () => {
    repository.anonymizeUser.mockResolvedValue({
      userId: "user-2",
      anonymizedAt: new Date("2026-04-16T08:30:00.000Z")
    });

    const result = await service.anonymizePersonalData("user-2", buildActor({ tenantId: "tenant-1" }));

    expect(repository.anonymizeUser).toHaveBeenCalledWith("user-2", "user-1");
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "personal-data-anonymization",
        targetId: "user-2"
      })
    );
    expect(result).toEqual({
      userId: "user-2",
      anonymizedAt: "2026-04-16T08:30:00.000Z"
    });
  });
});
