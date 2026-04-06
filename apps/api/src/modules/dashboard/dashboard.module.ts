/** dashboard 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";

import { DashboardController } from "./dashboard.controller";
import { DashboardRepository } from "./repositories/dashboard.repository";
import { DashboardService } from "./dashboard.service";

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository]
})
export class DashboardModule {}
