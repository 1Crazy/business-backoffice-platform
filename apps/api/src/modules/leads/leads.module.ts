/** leads 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";

import { LeadsController } from "./leads.controller";
import { LeadsRepository } from "./repositories/leads.repository";
import { LeadsService } from "./leads.service";

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadsRepository],
  exports: [LeadsService]
})
export class LeadsModule {}
