/** 批任务 repository：负责异步导入导出任务及失败明细的持久化。 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const batchTaskOperatorSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  displayName: true
});

const batchTaskFailureSelect = Prisma.validator<Prisma.BatchTaskFailureSelect>()({
  id: true,
  rowNumber: true,
  identifier: true,
  reason: true,
  payload: true,
  createdAt: true
});

const batchTaskInclude = Prisma.validator<Prisma.BatchTaskInclude>()({
  operator: {
    select: batchTaskOperatorSelect
  }
});

const batchTaskExportCustomerSelect = Prisma.validator<Prisma.CustomerSelect>()({
  id: true,
  name: true,
  contactName: true,
  phone: true,
  email: true,
  source: true,
  status: true,
  ownerId: true,
  notes: true,
  createdAt: true
});

export type BatchTaskRecord = Prisma.BatchTaskGetPayload<{
  include: typeof batchTaskInclude;
}>;

export type BatchTaskFailureRecord = Prisma.BatchTaskFailureGetPayload<{
  select: typeof batchTaskFailureSelect;
}>;

export type BatchTaskExportCustomerRecord = Prisma.CustomerGetPayload<{
  select: typeof batchTaskExportCustomerSelect;
}>;

@Injectable()
export class BatchTasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  createTask(input: {
    tenantId?: string;
    category: BatchTaskRecord["category"];
    resourceType: string;
    label: string;
    operatorId: string;
    filterSnapshot?: Prisma.InputJsonValue;
    inputFileName?: string;
  }) {
    return this.prisma.batchTask.create({
      data: {
        tenantId: input.tenantId ?? undefined,
        category: input.category,
        resourceType: input.resourceType,
        label: input.label,
        operatorId: input.operatorId,
        filterSnapshot: input.filterSnapshot,
        inputFileName: input.inputFileName
      },
      include: batchTaskInclude
    });
  }

  listTasks(where: Prisma.BatchTaskWhereInput) {
    return this.prisma.batchTask.findMany({
      where,
      include: batchTaskInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });
  }

  findTaskById(id: string) {
    return this.prisma.batchTask.findUniqueOrThrow({
      where: { id },
      include: batchTaskInclude
    });
  }

  listCustomersForExport(where: Prisma.CustomerWhereInput) {
    return this.prisma.customer.findMany({
      where,
      select: batchTaskExportCustomerSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });
  }

  createCustomer(data: Prisma.CustomerUncheckedCreateInput) {
    return this.prisma.customer.create({
      data
    });
  }

  listFailures(taskId: string) {
    return this.prisma.batchTaskFailure.findMany({
      where: {
        taskId
      },
      select: batchTaskFailureSelect,
      orderBy: [{ rowNumber: "asc" }, { createdAt: "asc" }]
    });
  }

  updateTask(
    id: string,
    data: Prisma.BatchTaskUpdateInput
  ) {
    return this.prisma.batchTask.update({
      where: { id },
      data,
      include: batchTaskInclude
    });
  }

  replaceFailures(
    taskId: string,
    failures: Array<{
      rowNumber?: number | null;
      identifier?: string | null;
      reason: string;
      payload?: Prisma.InputJsonValue;
    }>
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.batchTaskFailure.deleteMany({
        where: {
          taskId
        }
      });

      if (failures.length === 0) {
        return [];
      }

      return Promise.all(
        failures.map((item) =>
          tx.batchTaskFailure.create({
            data: {
              taskId,
              rowNumber: item.rowNumber ?? undefined,
              identifier: item.identifier ?? undefined,
              reason: item.reason,
              payload: item.payload
            },
            select: batchTaskFailureSelect
          })
        )
      );
    });
  }
}
