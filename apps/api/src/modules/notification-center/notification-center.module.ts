import { Module } from "@nestjs/common";

import { EmailNotificationChannelAdapter } from "./adapters/email-notification-channel.adapter";
import { EnterpriseImNotificationChannelAdapter } from "./adapters/enterprise-im-notification-channel.adapter";
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
    EnterpriseImNotificationChannelAdapter,
    {
      provide: NOTIFICATION_CHANNEL_ADAPTERS,
      useFactory: (
        emailAdapter: EmailNotificationChannelAdapter,
        enterpriseImAdapter: EnterpriseImNotificationChannelAdapter
      ) => [emailAdapter, enterpriseImAdapter],
      inject: [EmailNotificationChannelAdapter, EnterpriseImNotificationChannelAdapter]
    }
  ],
  exports: [
    NotificationCenterRepository,
    NotificationCenterService,
    EmailNotificationChannelAdapter,
    EnterpriseImNotificationChannelAdapter,
    NOTIFICATION_CHANNEL_ADAPTERS
  ]
})
export class NotificationCenterModule {}
