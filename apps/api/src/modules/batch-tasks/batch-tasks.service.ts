/** 批任务 service：负责导入导出任务创建、异步执行和结果文件编排。 */
import { Readable } from "stream";

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  AuditActionType,
  BatchTaskCategory,
  BatchTaskStatus,
  Prisma
} from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { DataScopeService } from "@/common/data-scope/data-scope.service";
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

@Injectable()
export class BatchTasksService {
  constructor(
    private readonly batchTasksRepository: BatchTasksRepository,
    private readonly dataScopeService: DataScopeService,
    private readonly auditLogsService: AuditLogsService,
    @Inject(ATTACHMENT_STORAGE_DRIVER)
    private readonly storageDriver: AttachmentStorageDriver
  ) {}

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
    const task = await this.batchTasksRepository.createTask({
      tenantId: requireTenantId(actor),
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

    queueMicrotask(() => {
      void this.processCustomerExportTask(task.id, dto, actor);
    });

    return mapBatchTask(task);
  }

  async createCustomerImportTask(file: Express.Multer.File | undefined, ownerId: string | undefined, actor: AuthUser) {
    this.assertPermission(actor, "customer:write", "You do not have permission to import customers.");

    if (!file) {
      throw new BadRequestException("Import file is required.");
    }

    if (!["text/csv", "application/vnd.ms-excel"].includes(file.mimetype)) {
      throw new BadRequestException("Only CSV import files are supported.");
    }

    const task = await this.batchTasksRepository.createTask({
      tenantId: requireTenantId(actor),
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

    queueMicrotask(() => {
      void this.processCustomerImportTask(task.id, file, ownerId, actor);
    });

    return mapBatchTask(task);
  }

  async downloadResultFile(id: string, actor: AuthUser) {
    const task = await this.batchTasksRepository.findTaskById(id);

    if (!task.resultStorageKey || !task.resultFileName) {
      throw new NotFoundException("Batch task result file was not found.");
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
      throw new NotFoundException("Batch task failure file was not found.");
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
      throw new BadRequestException("Import file must contain a header row and at least one data row.");
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

    throw new ForbiddenException("You do not have permission to read this batch task.");
  }

  private toJsonValue(value: Record<string, unknown>) {
    return value as Prisma.InputJsonValue;
  }
}
