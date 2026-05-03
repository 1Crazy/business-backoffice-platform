import { AttachmentStorageProvider, BatchTaskCategory, BatchTaskStatus } from "@prisma/client";
import { Readable } from "stream";

import { TenantQuotaExceededException } from "../src/common/tenant/tenant-quota.service";
import { BatchTasksService } from "../src/modules/batch-tasks/batch-tasks.service";

function buildActor(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    tenantId: "tenant-default",
    tenantCode: "default",
    username: "operator",
    displayName: "运维管理员",
    roleCodes: ["super-admin"],
    permissions: ["customer:read", "customer:write"],
    ...overrides
  } as any;
}

function buildTaskRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    category: BatchTaskCategory.EXPORT,
    resourceType: "CUSTOMER",
    label: "客户导出",
    status: BatchTaskStatus.PENDING,
    progress: 0,
    totalCount: 0,
    successCount: 0,
    failureCount: 0,
    operatorId: "user-1",
    filterSnapshot: null,
    summary: null,
    failureSummary: null,
    inputFileName: null,
    resultFileName: null,
    resultMimeType: null,
    resultStorageProvider: null,
    resultStorageKey: null,
    failureFileName: null,
    failureMimeType: null,
    failureStorageProvider: null,
    failureStorageKey: null,
    startedAt: null,
    finishedAt: null,
    createdAt: new Date("2026-04-16T08:00:00.000Z"),
    updatedAt: new Date("2026-04-16T08:00:00.000Z"),
    operator: {
      id: "user-1",
      displayName: "运维管理员"
    },
    ...overrides
  } as any;
}

async function flushAsyncWork() {
  await new Promise((resolve) => setImmediate(resolve));
  await Promise.resolve();
}

describe("BatchTasksService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates and completes a customer export task asynchronously", async () => {
    const exportCustomers = [
      {
        id: "customer-1",
        name: "Beta Corp",
        contactName: "王强",
        phone: "13800000000",
        email: "beta@example.com",
        source: "campaign",
        status: null,
        ownerId: "owner-1",
        notes: "重点客户",
        createdAt: new Date("2026-04-15T06:00:00.000Z"),
        updatedAt: new Date("2026-04-15T06:30:00.000Z")
      }
    ];
    const batchTasksRepository = {
      createTask: vi.fn().mockResolvedValue(buildTaskRecord()),
      updateTask: vi.fn().mockResolvedValue(undefined),
      findTaskById: vi.fn(),
      listTasks: vi.fn(),
      listFailures: vi.fn(),
      replaceFailures: vi.fn(),
      listCustomersForExport: vi.fn().mockResolvedValue(exportCustomers)
    } as any;
    const dataScopeService = {
      buildScopedCustomerFilter: vi.fn().mockResolvedValue({
        ownerId: {
          in: ["owner-1"]
        }
      }),
      assertOwnerAccessible: vi.fn().mockResolvedValue(undefined)
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const storageDriver = {
      store: vi.fn().mockResolvedValue({
        storageProvider: AttachmentStorageProvider.OBJECT_STORAGE,
        storageKey: "batch-task/customers-export-task-1.csv",
        fileName: "customers-export-task-1.csv"
      }),
      openReadStream: vi.fn(),
      delete: vi.fn()
    } as any;
    const tenantQuotaService = {
      assertMonthlyTaskQuotaAvailable: vi.fn().mockResolvedValue(undefined)
    } as any;
    const jobQueueService = {
      registerHandler: vi.fn(),
      enqueue: vi.fn().mockResolvedValue({}),
      scheduleRun: vi.fn()
    } as any;
    const service = new BatchTasksService(
      batchTasksRepository,
      dataScopeService,
      auditLogsService,
      tenantQuotaService,
      storageDriver,
      jobQueueService
    );
    service.onModuleInit();
    const actor = buildActor();

    const result = await service.createCustomerExportTask(
      {
        keyword: "Beta",
        status: "active",
        ownerId: "owner-1"
      },
      actor
    );

    expect(batchTasksRepository.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        category: BatchTaskCategory.EXPORT,
        resourceType: "CUSTOMER",
        operatorId: actor.id
      })
    );
    expect(jobQueueService.registerHandler).toHaveBeenCalledWith("batch-task.customer-export", expect.any(Function));
    expect(jobQueueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "batch-task.customer-export",
        correlationId: "task-1"
      })
    );
    expect(jobQueueService.scheduleRun).toHaveBeenCalledWith(["batch-task.customer-export"]);

    const exportHandler = jobQueueService.registerHandler.mock.calls.find(
      ([type]: [string]) => type === "batch-task.customer-export"
    )?.[1];
    expect(exportHandler).toBeDefined();
    await exportHandler({
      payload: jobQueueService.enqueue.mock.calls[0][0].payload
    });

    expect(tenantQuotaService.assertMonthlyTaskQuotaAvailable).toHaveBeenCalledWith("tenant-default");
    expect(dataScopeService.buildScopedCustomerFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        id: actor.id,
        tenantId: actor.tenantId,
        username: actor.username,
        displayName: actor.displayName
      }),
      "owner-1"
    );
    expect(batchTasksRepository.listCustomersForExport).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: {
          in: ["owner-1"]
        },
        status: "active",
        OR: expect.any(Array)
      })
    );
    expect(storageDriver.store).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: "customers-export-task-1.csv",
        mimetype: "text/csv"
      })
    );
    expect(batchTasksRepository.updateTask).toHaveBeenNthCalledWith(
      1,
      "task-1",
      expect.objectContaining({
        status: BatchTaskStatus.RUNNING,
        progress: 10
      })
    );
    expect(batchTasksRepository.updateTask).toHaveBeenNthCalledWith(
      2,
      "task-1",
      expect.objectContaining({
        status: BatchTaskStatus.SUCCEEDED,
        totalCount: 1,
        successCount: 1,
        failureCount: 0,
        resultFileName: "customers-export-task-1.csv",
        resultStorageProvider: AttachmentStorageProvider.OBJECT_STORAGE,
        resultStorageKey: "batch-task/customers-export-task-1.csv"
      })
    );
    expect(result).toMatchObject({
      id: "task-1",
      category: BatchTaskCategory.EXPORT,
      status: BatchTaskStatus.PENDING
    });
  });

  it("captures row failures and writes a failure file for customer import tasks", async () => {
    const batchTasksRepository = {
      createTask: vi.fn().mockResolvedValue(
        buildTaskRecord({
          id: "task-import-1",
          category: BatchTaskCategory.IMPORT,
          label: "客户导入",
          inputFileName: "customers.csv"
        })
      ),
      updateTask: vi.fn().mockResolvedValue(undefined),
      findTaskById: vi.fn(),
      listTasks: vi.fn(),
      listFailures: vi.fn(),
      replaceFailures: vi.fn().mockResolvedValue(undefined),
      createCustomer: vi.fn().mockResolvedValue({
        id: "customer-1"
      })
    } as any;
    const dataScopeService = {
      buildScopedCustomerFilter: vi.fn(),
      assertOwnerAccessible: vi.fn().mockResolvedValue(undefined)
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const storageDriver = {
      store: vi.fn().mockResolvedValue({
        storageProvider: AttachmentStorageProvider.LOCAL,
        storageKey: "batch-task/customers-import-failures-task-import-1.csv",
        fileName: "customers-import-failures-task-import-1.csv"
      }),
      openReadStream: vi.fn(),
      delete: vi.fn()
    } as any;
    const tenantQuotaService = {
      assertMonthlyTaskQuotaAvailable: vi.fn().mockResolvedValue(undefined)
    } as any;
    const jobQueueService = {
      registerHandler: vi.fn(),
      enqueue: vi.fn().mockResolvedValue({}),
      scheduleRun: vi.fn()
    } as any;
    const service = new BatchTasksService(
      batchTasksRepository,
      dataScopeService,
      auditLogsService,
      tenantQuotaService,
      storageDriver,
      jobQueueService
    );
    service.onModuleInit();
    const actor = buildActor();

    const result = await service.createCustomerImportTask(
      {
        originalname: "customers.csv",
        mimetype: "text/csv",
        buffer: Buffer.from(
          ["name,contactName,phone,email,source,status,ownerId,notes", "Acme,李雷,13800000001,acme@example.com,expo,active,,首批", ",韩梅梅,13800000002,hm@example.com,expo,active,,"].join(
            "\n"
          ),
          "utf-8"
        )
      } as Express.Multer.File,
      undefined,
      actor
    );

    expect(jobQueueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "batch-task.customer-import",
        correlationId: "task-import-1"
      })
    );
    expect(jobQueueService.scheduleRun).toHaveBeenCalledWith(["batch-task.customer-import"]);
    const importHandler = jobQueueService.registerHandler.mock.calls.find(
      ([type]: [string]) => type === "batch-task.customer-import"
    )?.[1];
    expect(importHandler).toBeDefined();
    await importHandler({
      payload: jobQueueService.enqueue.mock.calls[0][0].payload
    });

    expect(batchTasksRepository.createCustomer).toHaveBeenCalledTimes(1);
    expect(dataScopeService.assertOwnerAccessible).not.toHaveBeenCalled();
    expect(batchTasksRepository.replaceFailures).toHaveBeenCalledWith(
      "task-import-1",
      expect.arrayContaining([
        expect.objectContaining({
          rowNumber: 3,
          reason: "客户名称不能为空。"
        })
      ])
    );
    expect(storageDriver.store).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: "customers-import-failures-task-import-1.csv",
        mimetype: "text/csv"
      })
    );
    expect(batchTasksRepository.updateTask).toHaveBeenNthCalledWith(
      2,
      "task-import-1",
      expect.objectContaining({
        status: BatchTaskStatus.FAILED,
        totalCount: 2,
        successCount: 1,
        failureCount: 1,
        failureFileName: "customers-import-failures-task-import-1.csv",
        failureStorageProvider: AttachmentStorageProvider.LOCAL,
        failureStorageKey: "batch-task/customers-import-failures-task-import-1.csv"
      })
    );
    expect(result).toMatchObject({
      id: "task-import-1",
      category: BatchTaskCategory.IMPORT,
      status: BatchTaskStatus.PENDING
    });
  });

  it("downloads result files and records audit logs", async () => {
    const stream = Readable.from(["csv-data"]);
    const batchTasksRepository = {
      createTask: vi.fn(),
      updateTask: vi.fn(),
      findTaskById: vi.fn().mockResolvedValue(
        buildTaskRecord({
          resultFileName: "customers-export-task-1.csv",
          resultMimeType: "text/csv",
          resultStorageKey: "batch-task/customers-export-task-1.csv"
        })
      ),
      listTasks: vi.fn(),
      listFailures: vi.fn(),
      replaceFailures: vi.fn()
    } as any;
    const storageDriver = {
      store: vi.fn(),
      openReadStream: vi.fn().mockResolvedValue({
        stream,
        size: 8
      }),
      delete: vi.fn()
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const tenantQuotaService = {
      assertMonthlyTaskQuotaAvailable: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new BatchTasksService(
      batchTasksRepository,
      {} as any,
      auditLogsService,
      tenantQuotaService,
      storageDriver
    );
    const actor = buildActor({
      permissions: ["customer:read"]
    });

    const result = await service.downloadResultFile("task-1", actor);

    expect(batchTasksRepository.findTaskById).toHaveBeenCalledWith("task-1");
    expect(storageDriver.openReadStream).toHaveBeenCalledWith("batch-task/customers-export-task-1.csv");
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "DOWNLOAD",
        targetType: "batch-task-result",
        targetId: "task-1"
      })
    );
    expect(result).toMatchObject({
      fileName: "customers-export-task-1.csv",
      mimeType: "text/csv",
      size: 8
    });
  });

  it("rejects customer export tasks when monthlyTaskQuota is exhausted", async () => {
    const batchTasksRepository = {
      createTask: vi.fn()
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const tenantQuotaService = {
      assertMonthlyTaskQuotaAvailable: vi.fn().mockRejectedValue(
        new TenantQuotaExceededException({
          type: "monthlyTasks",
          limit: 3,
          used: 3,
          requested: 1,
          message: "租户月度任务配额不足。"
        })
      )
    } as any;
    const service = new BatchTasksService(
      batchTasksRepository,
      {} as any,
      auditLogsService,
      tenantQuotaService,
      {
        store: vi.fn(),
        openReadStream: vi.fn(),
        delete: vi.fn()
      } as any
    );

    await expect(service.createCustomerExportTask({}, buildActor())).rejects.toThrow("租户月度任务配额不足。");

    expect(batchTasksRepository.createTask).not.toHaveBeenCalled();
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "ACCESS_DENIED",
        targetType: "tenant-quota",
        detail: expect.objectContaining({
          quotaType: "monthlyTasks",
          attemptedOperation: "batch-task.customer-export"
        })
      })
    );
  });

  it("keeps queueMicrotask fallback when job queue is unavailable", async () => {
    const batchTasksRepository = {
      createTask: vi.fn().mockResolvedValue(buildTaskRecord()),
      updateTask: vi.fn().mockResolvedValue(undefined),
      listCustomersForExport: vi.fn().mockResolvedValue([])
    } as any;
    const service = new BatchTasksService(
      batchTasksRepository,
      {
        buildScopedCustomerFilter: vi.fn().mockResolvedValue({})
      } as any,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      {
        assertMonthlyTaskQuotaAvailable: vi.fn().mockResolvedValue(undefined)
      } as any,
      {
        store: vi.fn().mockResolvedValue({
          storageProvider: AttachmentStorageProvider.LOCAL,
          storageKey: "batch-task/customers-export-task-1.csv"
        })
      } as any
    );

    await service.createCustomerExportTask({}, buildActor());
    await flushAsyncWork();

    expect(batchTasksRepository.updateTask).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({
        status: BatchTaskStatus.RUNNING
      })
    );
  });
});
