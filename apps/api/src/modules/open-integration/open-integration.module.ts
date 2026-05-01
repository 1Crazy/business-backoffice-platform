import { Module } from "@nestjs/common";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { AuthModule } from "../auth/auth.module";
import { OpenApiController, OpenIntegrationController } from "./open-integration.controller";
import { OpenIntegrationRepository } from "./repositories/open-integration.repository";
import { OpenIntegrationService } from "./open-integration.service";

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [OpenIntegrationController, OpenApiController],
  providers: [OpenIntegrationRepository, OpenIntegrationService],
  exports: [OpenIntegrationService]
})
export class OpenIntegrationModule {}
