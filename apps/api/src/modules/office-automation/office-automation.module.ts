/** OA 模块装配：负责聚合 OA 工作台、审批、公告和通讯录相关能力。 */
import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { NotificationCenterModule } from "../notification-center/notification-center.module";
import { OpenIntegrationModule } from "../open-integration/open-integration.module";
import { OfficeAutomationController } from "./office-automation.controller";
import { OfficeAutomationRepository } from "./repositories/office-automation.repository";
import { OfficeAutomationService } from "./office-automation.service";

@Module({
  imports: [AuditLogsModule, NotificationCenterModule, OpenIntegrationModule],
  controllers: [OfficeAutomationController],
  providers: [OfficeAutomationService, OfficeAutomationRepository]
})
export class OfficeAutomationModule {}
