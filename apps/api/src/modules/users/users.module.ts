/** users 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";

import { UsersController } from "./users.controller";
import { UsersRepository } from "./repositories/users.repository";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService]
})
export class UsersModule {}
