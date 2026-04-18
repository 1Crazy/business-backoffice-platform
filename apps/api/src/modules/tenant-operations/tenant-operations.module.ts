import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { TenantOperationsController } from "./tenant-operations.controller";
import { TenantOperationsRepository } from "./repositories/tenant-operations.repository";
import { TenantOperationsService } from "./tenant-operations.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [TenantOperationsController],
  providers: [TenantOperationsRepository, TenantOperationsService]
})
export class TenantOperationsModule {}
