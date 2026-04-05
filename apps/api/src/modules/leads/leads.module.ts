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
