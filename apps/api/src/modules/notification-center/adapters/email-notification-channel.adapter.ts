/** 邮件适配器：负责提供首批外部渠道的最小可用实现，当前以可审计的模拟投递为主。 */
import { Injectable } from "@nestjs/common";

import type { NotificationChannelAdapter } from "../notification-center.types";

@Injectable()
export class EmailNotificationChannelAdapter implements NotificationChannelAdapter {
  readonly channel = "EMAIL" as const;
  readonly adapterCode = "smtp-default";

  async send(input: Parameters<NotificationChannelAdapter["send"]>[0]) {
    if (!input.recipientEmail) {
      return {
        status: "SKIPPED" as const,
        errorMessage: "缺少接收人邮箱，已跳过邮件投递。"
      };
    }

    return {
      status: "SENT" as const,
      externalMessageId: `email:${input.notificationId}`,
      response: {
        provider: "mock-smtp",
        recipientEmail: input.recipientEmail,
        recipientDisplayName: input.recipientDisplayName ?? null
      }
    };
  }
}
