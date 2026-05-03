import { createHmac } from "crypto";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { NotificationChannelAdapter } from "../notification-center.types";

@Injectable()
export class EnterpriseImNotificationChannelAdapter implements NotificationChannelAdapter {
  readonly channel = "ENTERPRISE_IM" as const;
  readonly adapterCode = "enterprise-im-default";

  constructor(private readonly configService: ConfigService) {}

  async send(input: Parameters<NotificationChannelAdapter["send"]>[0]) {
    const webhookUrl = this.configService.get<string>("ENTERPRISE_IM_WEBHOOK_URL")?.trim();
    const webhookSecret = this.configService.get<string>("ENTERPRISE_IM_WEBHOOK_SECRET")?.trim();

    if (!webhookUrl) {
      if (!this.isLocalRuntime() && !this.allowMockDelivery()) {
        return {
          status: "FAILED" as const,
          errorMessage: "未配置企业 IM Webhook 地址。",
          response: {
            provider: "wecom",
            mode: "provider-misconfigured"
          }
        };
      }

      return {
        status: "SENT" as const,
        externalMessageId: `enterprise-im:${input.notificationId}`,
        response: {
          provider: "mock-enterprise-im"
        }
      };
    }

    const targetUrl = this.resolveTargetUrl(input);
    const markdown = [
      `**${input.title}**`,
      input.summary ? `> ${input.summary}` : null,
      targetUrl ? `[${input.targetLabel ?? "打开链接"}](${targetUrl})` : null
    ]
      .filter(Boolean)
      .join("\n");
    const response = await fetch(this.buildWebhookUrl(webhookUrl, webhookSecret), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: {
          content: markdown
        }
      })
    });
    const payload = await this.readJsonResponse(response);
    const isOk = response.ok && (payload?.errcode === undefined || payload?.errcode === 0);

    if (!isOk) {
      return {
        status: "FAILED" as const,
        errorMessage: `企业 IM provider 返回 HTTP ${response.status}。`,
        response: {
          provider: "wecom",
          status: response.status,
          body: payload
        }
      };
    }

    return {
      status: "SENT" as const,
      externalMessageId: `enterprise-im:${input.notificationId}`,
      response: {
        provider: "wecom"
      }
    };
  }

  private resolveTargetUrl(input: Parameters<NotificationChannelAdapter["send"]>[0]) {
    if (typeof input.payload?.targetUrl === "string") {
      return input.payload.targetUrl;
    }

    if (!input.targetPath) {
      return null;
    }

    const baseUrl = this.configService.get<string>("ENTERPRISE_IM_LINK_BASE_URL")?.trim();
    if (!baseUrl) {
      return input.targetPath;
    }

    return new URL(input.targetPath, baseUrl).toString();
  }

  private buildWebhookUrl(webhookUrl: string, webhookSecret?: string) {
    if (!webhookSecret) {
      return webhookUrl;
    }

    const timestamp = Date.now().toString();
    const signature = createHmac("sha256", webhookSecret)
      .update(`${timestamp}\n${webhookSecret}`)
      .digest("base64");
    const url = new URL(webhookUrl);
    url.searchParams.set("timestamp", timestamp);
    url.searchParams.set("sign", signature);
    return url.toString();
  }

  private isLocalRuntime() {
    const nodeEnv = this.configService.get<string>("NODE_ENV", "development").trim().toLowerCase();
    return ["development", "dev", "local", "test"].includes(nodeEnv);
  }

  private allowMockDelivery() {
    return this.configService.get<string>("ALLOW_MOCK_NOTIFICATION_DELIVERY")?.trim().toLowerCase() === "true";
  }

  private async readJsonResponse(response: Response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
}
