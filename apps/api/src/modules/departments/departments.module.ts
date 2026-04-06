/** departments 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";

import { DepartmentsController } from "./departments.controller";
import { DepartmentsRepository } from "./repositories/departments.repository";
import { DepartmentsService } from "./departments.service";

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentsRepository],
  exports: [DepartmentsService]
})
export class DepartmentsModule {}
