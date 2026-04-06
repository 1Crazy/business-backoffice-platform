/** audit-logs 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Global, Module } from "@nestjs/common";

import { AuditLogsController } from "./audit-logs.controller";
import { AuditLogsRepository } from "./repositories/audit-logs.repository";
import { AuditLogsService } from "./audit-logs.service";

@Global()
@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository],
  exports: [AuditLogsService]
})
export class AuditLogsModule {}
