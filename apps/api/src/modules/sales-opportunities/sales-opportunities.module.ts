/** sales-opportunities 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";

import { SalesOpportunitiesController } from "./sales-opportunities.controller";
import { SalesOpportunitiesRepository } from "./repositories/sales-opportunities.repository";
import { SalesOpportunitiesService } from "./sales-opportunities.service";

@Module({
  controllers: [SalesOpportunitiesController],
  providers: [SalesOpportunitiesService, SalesOpportunitiesRepository],
  exports: [SalesOpportunitiesService]
})
export class SalesOpportunitiesModule {}
