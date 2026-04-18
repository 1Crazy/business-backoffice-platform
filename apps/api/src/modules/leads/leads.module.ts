/** leads 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";

import { NotificationCenterModule } from "../notification-center/notification-center.module";
import { LeadsController } from "./leads.controller";
import { LeadsRepository } from "./repositories/leads.repository";
import { LeadsService } from "./leads.service";

@Module({
  imports: [NotificationCenterModule],
  controllers: [LeadsController],
  providers: [LeadsService, LeadsRepository],
  exports: [LeadsService]
})
export class LeadsModule {}
