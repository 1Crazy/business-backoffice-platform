/** 批任务模块装配：负责聚合导入导出任务相关能力。 */
import { Module } from "@nestjs/common";

import { DataScopeModule } from "@/common/data-scope/data-scope.module";
import { JobQueueModule } from "@/common/job-queue/job-queue.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { UploadsModule } from "../uploads/uploads.module";
import { BatchTasksController } from "./batch-tasks.controller";
import { BatchTasksRepository } from "./repositories/batch-tasks.repository";
import { BatchTasksService } from "./batch-tasks.service";

@Module({
  imports: [DataScopeModule, JobQueueModule, AuditLogsModule, UploadsModule],
  controllers: [BatchTasksController],
  providers: [BatchTasksService, BatchTasksRepository],
  exports: [BatchTasksService]
})
export class BatchTasksModule {}
