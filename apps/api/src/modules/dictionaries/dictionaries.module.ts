import { Module } from "@nestjs/common";

import { DictionariesController } from "./dictionaries.controller";
import { DictionariesRepository } from "./repositories/dictionaries.repository";
import { DictionariesService } from "./dictionaries.service";

@Module({
  controllers: [DictionariesController],
  providers: [DictionariesService, DictionariesRepository]
})
export class DictionariesModule {}
