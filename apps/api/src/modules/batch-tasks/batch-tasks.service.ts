/** 批任务 service：负责导入导出任务创建、异步执行和结果文件编排。 */
import { Readable } from "stream";

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit
} from "@nestjs/common";
import {
  AuditActionType,
  BatchTaskCategory,
  BatchTaskStatus,
  Prisma
} from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { DataScopeService } from "@/common/data-scope/data-scope.service";
import { JobQueueService, type BackgroundJobHandler } from "@/common/job-queue/job-queue.service";
import { TenantQuotaExceededException, TenantQuotaService } from "@/common/tenant/tenant-quota.service";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ATTACHMENT_STORAGE_DRIVER, type AttachmentStorageDriver } from "../uploads/storage/attachment-storage.driver";
import { CreateCustomerExportTaskDto } from "./dto/create-customer-export-task.dto";
import { ListBatchTasksDto } from "./dto/list-batch-tasks.dto";
import { mapBatchTask, mapBatchTaskFailure } from "./mappers/batch-task.mapper";
import { BatchTasksRepository } from "./repositories/batch-tasks.repository";

type CustomerImportRow = {
  rowNumber: number;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  source?: string;
  status?: string;
  ownerId?: string;
  notes?: string;
};

const CUSTOMER_EXPORT_JOB_TYPE = "batch-task.customer-export";
const CUSTOMER_IMPORT_JOB_TYPE = "batch-task.customer-import";

@Injectable()
export class BatchTasksService implements OnModuleInit {
  constructor(
    private readonly batchTasksRepository: BatchTasksRepository,
    private readonly dataScopeService: DataScopeService,
    private readonly auditLogsService: AuditLogsService,
    private readonly tenantQuotaService: TenantQuotaService,
    @Inject(ATTACHMENT_STORAGE_DRIVER)
    private readonly storageDriver: AttachmentStorageDriver,
    private readonly jobQueueService?: JobQueueService
  ) {}

  onModuleInit(): void {
    this.jobQueueService?.registerHandler(CUSTOMER_EXPORT_JOB_TYPE, this.handleCustomerExportJob as BackgroundJobHandler);
    this.jobQueueService?.registerHandler(CUSTOMER_IMPORT_JOB_TYPE, this.handleCustomerImportJob as BackgroundJobHandler);
  }

  async listTasks(query: ListBatchTasksDto) {
    const tasks = await this.batchTasksRepository.listTasks({
      category: query.category,
      status: query.status,
      resourceType: query.resourceType
    });

    return tasks.map((item) => mapBatchTask(item));
  }

  async getTask(id: string) {
    const task = await this.batchTasksRepository.findTaskById(id);
    return mapBatchTask(task);
  }

  async listTaskFailures(id: string) {
    await this.batchTasksRepository.findTaskById(id);
    const failures = await this.batchTasksRepository.listFailures(id);
    return failures.map((item) => mapBatchTaskFailure(item));
  }

  async createCustomerExportTask(dto: CreateCustomerExportTaskDto, actor: AuthUser) {
    this.assertPermission(actor, "customer:read", "You do not have permission to export customers.");
    const tenantId = requireTenantId(actor);
    await this.assertMonthlyTaskQuotaAvailable(tenantId, actor, "batch-task.customer-export");
    const task = await this.batchTasksRepository.createTask({
      tenantId,
      category: BatchTaskCategory.EXPORT,
      resourceType: "CUSTOMER",
      label: "客户导出",
      operatorId: actor.id,
      filterSnapshot: this.toJsonValue({
        keyword: dto.keyword ?? null,
        status: dto.status ?? null,
        ownerId: dto.ownerId ?? null
      })
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "batch-task",
      targetId: task.id,
      detail: {
        category: task.category,
        resourceType: task.resourceType
      }
    });

    if (!this.jobQueueService) {
      queueMicrotask(() => {
        void this.processCustomerExportTask(task.id, dto, actor);
      });
      return mapBatchTask(task);
    }

    await this.jobQueueService.enqueue({
      type: CUSTOMER_EXPORT_JOB_TYPE,
      payload: {
        taskId: task.id,
        actorId: actor.id,
        actorTenantId: actor.tenantId ?? null,
        actorTenantCode: actor.tenantCode ?? null,
        actorUsername: actor.username,
        actorDisplayName: actor.displayName,
        actorDepartmentId: actor.departmentId ?? null,
        actorRoleCodes: actor.roleCodes,
        actorPermissions: actor.permissions,
        actorDataScopes: actor.dataScopes ?? [],
        keyword: dto.keyword ?? null,
        status: dto.status ?? null,
        ownerId: dto.ownerId ?? null
      },
      correlationId: task.id
    });
    this.jobQueueService.scheduleRun([CUSTOMER_EXPORT_JOB_TYPE]);

    return mapBatchTask(task);
  }

  async createCustomerImportTask(file: Express.Multer.File | undefined, ownerId: string | undefined, actor: AuthUser) {
    this.assertPermission(actor, "customer:write", "当前账号没有导入客户的权限。");

    if (!file) {
      throw new BadRequestException("请先上传导入文件。");
    }

    if (!["text/csv", "application/vnd.ms-excel"].includes(file.mimetype)) {
      throw new BadRequestException("当前只支持导入 CSV 文件。");
    }

    const tenantId = requireTenantId(actor);
    await this.assertMonthlyTaskQuotaAvailable(tenantId, actor, "batch-task.customer-import");
    const task = await this.batchTasksRepository.createTask({
      tenantId,
      category: BatchTaskCategory.IMPORT,
      resourceType: "CUSTOMER",
      label: "客户导入",
      operatorId: actor.id,
      filterSnapshot: this.toJsonValue({
        ownerId: ownerId ?? null
      }),
      inputFileName: file.originalname
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "batch-task",
      targetId: task.id,
      detail: {
        category: task.category,
        resourceType: task.resourceType,
        inputFileName: file.originalname
      }
    });

    if (!this.jobQueueService) {
      queueMicrotask(() => {
        void this.processCustomerImportTask(task.id, file, ownerId, actor);
      });
      return mapBatchTask(task);
    }

    await this.jobQueueService.enqueue({
      type: CUSTOMER_IMPORT_JOB_TYPE,
      payload: {
        taskId: task.id,
        actorId: actor.id,
        actorTenantId: actor.tenantId ?? null,
        actorTenantCode: actor.tenantCode ?? null,
        actorUsername: actor.username,
        actorDisplayName: actor.displayName,
        actorDepartmentId: actor.departmentId ?? null,
        actorRoleCodes: actor.roleCodes,
        actorPermissions: actor.permissions,
        actorDataScopes: actor.dataScopes ?? [],
        fileName: file.originalname,
        fileMimeType: file.mimetype,
        fileContentBase64: file.buffer.toString("base64"),
        ownerId: ownerId ?? null
      },
      correlationId: task.id
    });
    this.jobQueueService.scheduleRun([CUSTOMER_IMPORT_JOB_TYPE]);

    return mapBatchTask(task);
  }

  private handleCustomerExportJob = async (job: Parameters<BackgroundJobHandler>[0]) => {
    const payload = this.readJobPayload(job.payload);
    await this.processCustomerExportTask(
      this.readRequiredPayloadString(payload, "taskId"),
      {
        keyword: this.readOptionalPayloadString(payload, "keyword"),
        status: this.readOptionalPayloadString(payload, "status"),
        ownerId: this.readOptionalPayloadString(payload, "ownerId")
      },
      this.readActorFromJobPayload(payload)
    );

    return {
      taskId: this.readRequiredPayloadString(payload, "taskId"),
      status: "SUCCEEDED"
    };
  };

  private handleCustomerImportJob = async (job: Parameters<BackgroundJobHandler>[0]) => {
    const payload = this.readJobPayload(job.payload);
    const fileContentBase64 = this.readRequiredPayloadString(payload, "fileContentBase64");
    const fileName = this.readRequiredPayloadString(payload, "fileName");
    const fileMimeType = this.readRequiredPayloadString(payload, "fileMimeType");
    const buffer = Buffer.from(fileContentBase64, "base64");

    await this.processCustomerImportTask(
      this.readRequiredPayloadString(payload, "taskId"),
      {
        fieldname: "file",
        originalname: fileName,
        encoding: "7bit",
        mimetype: fileMimeType,
        size: buffer.length,
        buffer,
        stream: Readable.from(buffer),
        destination: "",
        filename: fileName,
        path: "",
        destinationPath: ""
      } as unknown as Express.Multer.File,
      this.readOptionalPayloadString(payload, "ownerId"),
      this.readActorFromJobPayload(payload)
    );

    return {
      taskId: this.readRequiredPayloadString(payload, "taskId"),
      status: "SUCCEEDED"
    };
  };

  async downloadResultFile(id: string, actor: AuthUser) {
    const task = await this.batchTasksRepository.findTaskById(id);

    if (!task.resultStorageKey || !task.resultFileName) {
      throw new NotFoundException("批处理结果文件不存在。");
    }

    this.assertTaskReadable(task.resourceType, actor);
    const file = await this.storageDriver.openReadStream(task.resultStorageKey);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.DOWNLOAD,
      targetType: "batch-task-result",
      targetId: task.id
    });

    return {
      fileName: task.resultFileName,
      mimeType: task.resultMimeType ?? "text/csv",
      ...file
    };
  }

  async downloadFailureFile(id: string, actor: AuthUser) {
    const task = await this.batchTasksRepository.findTaskById(id);

    if (!task.failureStorageKey || !task.failureFileName) {
      throw new NotFoundException("批处理失败明细文件不存在。");
    }

    this.assertTaskReadable(task.resourceType, actor);
    const file = await this.storageDriver.openReadStream(task.failureStorageKey);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.DOWNLOAD,
      targetType: "batch-task-failure-file",
      targetId: task.id
    });

    return {
      fileName: task.failureFileName,
      mimeType: task.failureMimeType ?? "text/csv",
      ...file
    };
  }

  private async processCustomerExportTask(taskId: string, dto: CreateCustomerExportTaskDto, actor: AuthUser) {
    await this.batchTasksRepository.updateTask(taskId, {
      status: BatchTaskStatus.RUNNING,
      progress: 10,
      startedAt: new Date()
    });

    try {
      const ownerFilter = await this.dataScopeService.buildScopedCustomerFilter(actor, dto.ownerId);
      const customers = await this.batchTasksRepository.listCustomersForExport({
        ...ownerFilter,
        status: dto.status ?? undefined,
        OR: dto.keyword
          ? [
              { name: { contains: dto.keyword, mode: "insensitive" } },
              { contactName: { contains: dto.keyword, mode: "insensitive" } },
              { phone: { contains: dto.keyword, mode: "insensitive" } },
              { email: { contains: dto.keyword, mode: "insensitive" } }
            ]
          : undefined
      });
      const csvContent = this.buildCustomerExportCsv(customers);
      const storedFile = await this.storageDriver.store(
        this.createVirtualFile(`customers-export-${taskId}.csv`, "text/csv", Buffer.from(csvContent, "utf-8"))
      );

      await this.batchTasksRepository.updateTask(taskId, {
        status: BatchTaskStatus.SUCCEEDED,
        progress: 100,
        totalCount: customers.length,
        successCount: customers.length,
        failureCount: 0,
        summary: `导出了 ${customers.length} 条客户记录。`,
        resultFileName: `customers-export-${taskId}.csv`,
        resultMimeType: "text/csv",
        resultStorageProvider: storedFile.storageProvider,
        resultStorageKey: storedFile.storageKey,
        finishedAt: new Date()
      });
    } catch (error) {
      await this.batchTasksRepository.updateTask(taskId, {
        status: BatchTaskStatus.FAILED,
        progress: 100,
        failureSummary: error instanceof Error ? error.message : "客户导出失败。",
        finishedAt: new Date()
      });
    }
  }

  private async processCustomerImportTask(
    taskId: string,
    file: Express.Multer.File,
    ownerId: string | undefined,
    actor: AuthUser
  ) {
    await this.batchTasksRepository.updateTask(taskId, {
      status: BatchTaskStatus.RUNNING,
      progress: 10,
      startedAt: new Date()
    });

    try {
      const rows = this.parseCustomerImportCsv(file.buffer.toString("utf-8"));
      const fallbackOwnerId = ownerId ?? actor.id;
      const failures: Array<{
        rowNumber?: number | null;
        identifier?: string | null;
        reason: string;
        payload?: Prisma.InputJsonValue;
      }> = [];
      let successCount = 0;

      if (ownerId) {
        await this.dataScopeService.assertOwnerAccessible(
          actor,
          ownerId,
          "You cannot assign imported customers outside your data scope."
        );
      }

      for (const row of rows) {
        try {
          const resolvedOwnerId = row.ownerId?.trim() || fallbackOwnerId;

          if (resolvedOwnerId !== actor.id) {
            await this.dataScopeService.assertOwnerAccessible(
              actor,
              resolvedOwnerId,
              "You cannot assign imported customers outside your data scope."
            );
          }

          if (!row.name.trim()) {
            throw new BadRequestException("客户名称不能为空。");
          }

          await this.batchTasksRepository.createCustomer({
            tenantId: requireTenantId(actor),
            name: row.name.trim(),
            contactName: row.contactName?.trim() || undefined,
            phone: row.phone?.trim() || undefined,
            email: row.email?.trim() || undefined,
            source: row.source?.trim() || undefined,
            status: row.status?.trim() || "active",
            notes: row.notes?.trim() || undefined,
            ownerId: resolvedOwnerId
          });

          successCount += 1;
        } catch (error) {
          failures.push({
            rowNumber: row.rowNumber,
            identifier: row.name || row.phone || null,
            reason: error instanceof Error ? error.message : "客户导入失败。",
            payload: this.toJsonValue({
              name: row.name,
              phone: row.phone ?? null,
              ownerId: row.ownerId ?? fallbackOwnerId
            })
          });
        }
      }

      const failureSummary = failures.length ? `${failures.length} 条记录导入失败。` : null;
      const failureFile =
        failures.length > 0
          ? await this.storageDriver.store(
              this.createVirtualFile(
                `customers-import-failures-${taskId}.csv`,
                "text/csv",
                Buffer.from(this.buildFailureCsv(failures), "utf-8")
              )
            )
          : null;

      await this.batchTasksRepository.replaceFailures(taskId, failures);
      await this.batchTasksRepository.updateTask(taskId, {
        status: failures.length > 0 ? BatchTaskStatus.FAILED : BatchTaskStatus.SUCCEEDED,
        progress: 100,
        totalCount: rows.length,
        successCount,
        failureCount: failures.length,
        summary: `共处理 ${rows.length} 条记录，成功 ${successCount} 条。`,
        failureSummary,
        failureFileName: failureFile ? `customers-import-failures-${taskId}.csv` : undefined,
        failureMimeType: failureFile ? "text/csv" : undefined,
        failureStorageProvider: failureFile?.storageProvider,
        failureStorageKey: failureFile?.storageKey,
        finishedAt: new Date()
      });
    } catch (error) {
      await this.batchTasksRepository.updateTask(taskId, {
        status: BatchTaskStatus.FAILED,
        progress: 100,
        failureSummary: error instanceof Error ? error.message : "客户导入失败。",
        finishedAt: new Date()
      });
    }
  }

  private parseCustomerImportCsv(content: string): CustomerImportRow[] {
    const normalizedLines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (normalizedLines.length < 2) {
      throw new BadRequestException("导入文件必须包含表头且至少有一行数据。");
    }

    const headers = normalizedLines[0].split(",").map((item) => item.trim());

    return normalizedLines.slice(1).map((line, index) => {
      const values = line.split(",").map((item) => item.trim());
      const row = headers.reduce<Record<string, string>>((result, header, headerIndex) => {
        result[header] = values[headerIndex] ?? "";
        return result;
      }, {});

      return {
        rowNumber: index + 2,
        name: row.name ?? "",
        contactName: row.contactName || undefined,
        phone: row.phone || undefined,
        email: row.email || undefined,
        source: row.source || undefined,
        status: row.status || undefined,
        ownerId: row.ownerId || undefined,
        notes: row.notes || undefined
      };
    });
  }

  private buildCustomerExportCsv(customers: Array<{
    id: string;
    name: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    source: string | null;
    status: string | null;
    ownerId: string;
    notes: string | null;
    createdAt: Date;
  }>) {
    const header = ["id", "name", "contactName", "phone", "email", "source", "status", "ownerId", "notes", "createdAt"];
    const lines = customers.map((item) =>
      [
        item.id,
        item.name,
        item.contactName ?? "",
        item.phone ?? "",
        item.email ?? "",
        item.source ?? "",
        item.status ?? "",
        item.ownerId,
        item.notes ?? "",
        item.createdAt.toISOString()
      ].map((value) => this.escapeCsvCell(value)).join(",")
    );

    return [header.join(","), ...lines].join("\n");
  }

  private buildFailureCsv(
    failures: Array<{
      rowNumber?: number | null;
      identifier?: string | null;
      reason: string;
      payload?: Prisma.InputJsonValue;
    }>
  ) {
    const header = ["rowNumber", "identifier", "reason", "payload"];
    const lines = failures.map((item) =>
      [
        item.rowNumber ?? "",
        item.identifier ?? "",
        item.reason,
        item.payload ? JSON.stringify(item.payload) : ""
      ].map((value) => this.escapeCsvCell(value)).join(",")
    );

    return [header.join(","), ...lines].join("\n");
  }

  private createVirtualFile(fileName: string, mimetype: string, buffer: Buffer): Express.Multer.File {
    return {
      fieldname: "file",
      originalname: fileName,
      encoding: "7bit",
      mimetype,
      size: buffer.length,
      buffer,
      stream: Readable.from(buffer),
      destination: "",
      filename: fileName,
      path: "",
      destinationPath: ""
    } as unknown as Express.Multer.File;
  }

  private escapeCsvCell(value: string | number) {
    const normalized = String(value ?? "");

    if (normalized.includes(",") || normalized.includes("\"") || normalized.includes("\n")) {
      return `"${normalized.replaceAll("\"", "\"\"")}"`;
    }

    return normalized;
  }

  private assertPermission(actor: AuthUser, permission: string, message: string) {
    if (!actor.permissions.includes(permission)) {
      throw new ForbiddenException(message);
    }
  }

  private assertTaskReadable(resourceType: string, actor: AuthUser) {
    if (resourceType === "CUSTOMER") {
      this.assertPermission(actor, "customer:read", "You do not have permission to read batch task files.");
      return;
    }

    throw new ForbiddenException("当前账号没有权限查看该批处理任务。");
  }

  private toJsonValue(value: Record<string, unknown>) {
    return value as Prisma.InputJsonValue;
  }

  private readJobPayload(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private readRequiredPayloadString(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];

    if (typeof value !== "string" || !value) {
      throw new BadRequestException(`后台任务缺少必要参数：${key}。`);
    }

    return value;
  }

  private readOptionalPayloadString(payload: Record<string, unknown>, key: string): string | undefined {
    const value = payload[key];

    return typeof value === "string" && value ? value : undefined;
  }

  private readStringArrayPayload(payload: Record<string, unknown>, key: string): string[] {
    const value = payload[key];

    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  }

  private readActorFromJobPayload(payload: Record<string, unknown>): AuthUser {
    return {
      id: this.readRequiredPayloadString(payload, "actorId"),
      tenantId: this.readOptionalPayloadString(payload, "actorTenantId"),
      tenantCode: this.readOptionalPayloadString(payload, "actorTenantCode"),
      username: this.readRequiredPayloadString(payload, "actorUsername"),
      displayName: this.readRequiredPayloadString(payload, "actorDisplayName"),
      departmentId: this.readOptionalPayloadString(payload, "actorDepartmentId") ?? null,
      roleCodes: this.readStringArrayPayload(payload, "actorRoleCodes"),
      permissions: this.readStringArrayPayload(payload, "actorPermissions"),
      dataScopes: this.readStringArrayPayload(payload, "actorDataScopes") as AuthUser["dataScopes"]
    };
  }

  private async assertMonthlyTaskQuotaAvailable(
    tenantId: string,
    actor: AuthUser,
    attemptedOperation: string
  ): Promise<void> {
    try {
      await this.tenantQuotaService.assertMonthlyTaskQuotaAvailable(tenantId);
    } catch (error) {
      if (error instanceof TenantQuotaExceededException) {
        await this.auditLogsService.create({
          actorId: actor.id,
          actorName: actor.displayName,
          actionType: AuditActionType.ACCESS_DENIED,
          targetType: "tenant-quota",
          targetId: tenantId,
          detail: {
            attemptedOperation,
            quotaType: error.quota.type,
            limit: error.quota.limit,
            used: error.quota.used,
            requested: error.quota.requested,
            reason: error.quota.message
          }
        });
      }

      throw error;
    }
  }
}
