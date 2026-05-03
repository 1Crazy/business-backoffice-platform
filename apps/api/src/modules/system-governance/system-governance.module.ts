/** system-governance 模块装配：负责聚合系统治理所需的配置、审计和通知能力。 */
import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { NotificationCenterModule } from "../notification-center/notification-center.module";
import { OpenIntegrationModule } from "../open-integration/open-integration.module";
import { SystemGovernanceController } from "./system-governance.controller";
import { SystemGovernanceRepository } from "./repositories/system-governance.repository";
import { SystemGovernanceService } from "./system-governance.service";

@Module({
  imports: [AuditLogsModule, NotificationCenterModule, OpenIntegrationModule],
  controllers: [SystemGovernanceController],
  providers: [SystemGovernanceRepository, SystemGovernanceService],
  exports: [SystemGovernanceService]
})
export class SystemGovernanceModule {}
