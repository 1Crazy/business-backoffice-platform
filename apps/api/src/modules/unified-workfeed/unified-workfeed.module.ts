import { Module } from "@nestjs/common";

import { NotificationCenterModule } from "../notification-center/notification-center.module";
import { UnifiedWorkfeedController } from "./unified-workfeed.controller";
import { UnifiedWorkfeedRepository } from "./repositories/unified-workfeed.repository";
import { UnifiedWorkfeedService } from "./unified-workfeed.service";

@Module({
  imports: [NotificationCenterModule],
  controllers: [UnifiedWorkfeedController],
  providers: [UnifiedWorkfeedRepository, UnifiedWorkfeedService]
})
export class UnifiedWorkfeedModule {}
