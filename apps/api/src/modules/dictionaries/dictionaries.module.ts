/** dictionaries 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";

import { DictionariesController } from "./dictionaries.controller";
import { DictionariesRepository } from "./repositories/dictionaries.repository";
import { DictionariesService } from "./dictionaries.service";

@Module({
  controllers: [DictionariesController],
  providers: [DictionariesService, DictionariesRepository]
})
export class DictionariesModule {}
