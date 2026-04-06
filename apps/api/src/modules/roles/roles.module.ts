/** roles 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";

import { RolesController } from "./roles.controller";
import { RolesRepository } from "./repositories/roles.repository";
import { RolesService } from "./roles.service";

@Module({
  controllers: [RolesController],
  providers: [RolesService, RolesRepository],
  exports: [RolesService]
})
export class RolesModule {}
