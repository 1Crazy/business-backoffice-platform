import { Module } from "@nestjs/common";

import { EmailNotificationChannelAdapter } from "./adapters/email-notification-channel.adapter";
import { NOTIFICATION_CHANNEL_ADAPTERS } from "./notification-center.constants";
import { NotificationCenterController } from "./notification-center.controller";
import { NotificationCenterRepository } from "./repositories/notification-center.repository";
import { NotificationCenterService } from "./notification-center.service";

@Module({
  controllers: [NotificationCenterController],
  providers: [
    NotificationCenterRepository,
    NotificationCenterService,
    EmailNotificationChannelAdapter,
    {
      provide: NOTIFICATION_CHANNEL_ADAPTERS,
      useFactory: (emailAdapter: EmailNotificationChannelAdapter) => [emailAdapter],
      inject: [EmailNotificationChannelAdapter]
    }
  ],
  exports: [NotificationCenterRepository, NotificationCenterService]
})
export class NotificationCenterModule {}
