import { Module } from "@nestjs/common";

import { DataScopeModule } from "@/common/data-scope/data-scope.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { NotificationCenterModule } from "../notification-center/notification-center.module";
import { RevenueOperationsController } from "./revenue-operations.controller";
import { RevenueOperationsRepository } from "./repositories/revenue-operations.repository";
import { RevenueOperationsService } from "./revenue-operations.service";

@Module({
  imports: [DataScopeModule, AuditLogsModule, NotificationCenterModule],
  controllers: [RevenueOperationsController],
  providers: [RevenueOperationsRepository, RevenueOperationsService],
  exports: [RevenueOperationsService]
})
export class RevenueOperationsModule {}
