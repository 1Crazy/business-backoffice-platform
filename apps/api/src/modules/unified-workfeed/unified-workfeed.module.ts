import { Module } from "@nestjs/common";

import { UnifiedWorkfeedController } from "./unified-workfeed.controller";
import { UnifiedWorkfeedRepository } from "./unified-workfeed.repository";
import { UnifiedWorkfeedService } from "./unified-workfeed.service";

@Module({
  controllers: [UnifiedWorkfeedController],
  providers: [UnifiedWorkfeedRepository, UnifiedWorkfeedService]
})
export class UnifiedWorkfeedModule {}
