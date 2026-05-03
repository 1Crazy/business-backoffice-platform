/** workflow 模块装配：负责聚合流程模板、实例和任务动作相关能力。 */
import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { OpenIntegrationModule } from "../open-integration/open-integration.module";
import { WorkflowRepository } from "./repositories/workflow.repository";
import { WorkflowController } from "./workflow.controller";
import { WorkflowService } from "./workflow.service";

@Module({
  imports: [AuditLogsModule, OpenIntegrationModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowRepository],
  exports: [WorkflowService]
})
export class WorkflowModule {}
