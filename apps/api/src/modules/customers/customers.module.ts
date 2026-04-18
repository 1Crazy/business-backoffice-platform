/** customers 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";

import { NotificationCenterModule } from "../notification-center/notification-center.module";
import { CustomersController } from "./customers.controller";
import { CustomersRepository } from "./repositories/customers.repository";
import { CustomersService } from "./customers.service";

@Module({
  imports: [NotificationCenterModule],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository],
  exports: [CustomersService]
})
export class CustomersModule {}
