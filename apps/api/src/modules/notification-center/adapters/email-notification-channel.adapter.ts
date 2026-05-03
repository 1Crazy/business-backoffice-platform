/** 邮件适配器：优先走真实邮件 provider；仅在本地或显式 mock 开关下回落到模拟投递。 */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { NotificationChannelAdapter } from "../notification-center.types";

@Injectable()
export class EmailNotificationChannelAdapter implements NotificationChannelAdapter {
  readonly channel = "EMAIL" as const;
  readonly adapterCode = "smtp-default";

  constructor(private readonly configService: ConfigService) {}

  async send(input: Parameters<NotificationChannelAdapter["send"]>[0]) {
    if (!input.recipientEmail) {
      return {
        status: "SKIPPED" as const,
        errorMessage: "缺少接收人邮箱，已跳过邮件投递。"
      };
    }

    const isLocalRuntime = this.isLocalRuntime();
    const allowMockDelivery = this.allowMockDelivery();
    const provider = this.configService.get<string>("EMAIL_DELIVERY_PROVIDER", "resend").trim().toLowerCase();
    const resendApiKey = this.configService.get<string>("EMAIL_RESEND_API_KEY")?.trim();
    const resendApiUrl = this.configService.get<string>("EMAIL_RESEND_API_URL", "https://api.resend.com/emails").trim();
    const fromAddress = this.configService.get<string>("EMAIL_FROM_ADDRESS")?.trim();
    const replyTo = this.configService.get<string>("EMAIL_REPLY_TO")?.trim();

    if (provider !== "resend") {
      return {
        status: "FAILED" as const,
        errorMessage: `不支持的邮件 provider：${provider}。`,
        response: {
          provider
        }
      };
    }

    if (!resendApiKey || !fromAddress) {
      if (!isLocalRuntime && !allowMockDelivery) {
        return {
          status: "FAILED" as const,
          errorMessage: "未配置真实邮件 provider 所需的 API Key 或发件地址。",
          response: {
            provider: "resend",
            mode: "provider-misconfigured"
          }
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

    const body = this.buildEmailBody(input);
    const response = await fetch(resendApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [input.recipientEmail],
        reply_to: replyTo || undefined,
        subject: body.subject,
        text: body.text,
        html: body.html
      })
    });
    const payload = await this.readJsonResponse(response);

    if (!response.ok) {
      return {
        status: "FAILED" as const,
        errorMessage: `邮件 provider 返回 HTTP ${response.status}。`,
        response: {
          provider: "resend",
          status: response.status,
          body: payload
        }
      };
    }

    return {
      status: "SENT" as const,
      externalMessageId: typeof payload?.id === "string" ? payload.id : `email:${input.notificationId}`,
      response: {
        provider: "resend",
        recipientEmail: input.recipientEmail
      }
    };
  }

  private isLocalRuntime() {
    const nodeEnv = this.configService.get<string>("NODE_ENV", "development").trim().toLowerCase();
    return ["development", "dev", "local", "test"].includes(nodeEnv);
  }

  private allowMockDelivery() {
    return this.configService.get<string>("ALLOW_MOCK_NOTIFICATION_DELIVERY")?.trim().toLowerCase() === "true";
  }

  private buildEmailBody(input: Parameters<NotificationChannelAdapter["send"]>[0]) {
    const resetUrl = typeof input.payload?.resetUrl === "string" ? input.payload.resetUrl : null;
    const subject = input.title;
    const summary = input.summary?.trim() ? input.summary.trim() : "请按提示完成后续操作。";
    const targetUrl = resetUrl ?? this.toAbsoluteUrl(input.targetPath);
    const actionLabel = typeof input.payload?.actionLabel === "string" ? input.payload.actionLabel : input.targetLabel ?? "打开链接";

    const text = [subject, "", summary, targetUrl ? `${actionLabel}：${targetUrl}` : null, "", "如果不是本人操作，请忽略本邮件。"]
      .filter(Boolean)
      .join("\n");
    const html = [
      `<h2>${this.escapeHtml(subject)}</h2>`,
      `<p>${this.escapeHtml(summary)}</p>`,
      targetUrl
        ? `<p><a href="${this.escapeHtml(targetUrl)}" target="_blank" rel="noreferrer">${this.escapeHtml(actionLabel)}</a></p>`
        : "",
      "<p>如果不是本人操作，请忽略本邮件。</p>"
    ].join("");

    return {
      subject,
      text,
      html
    };
  }

  private toAbsoluteUrl(targetPath?: string | null) {
    if (!targetPath) {
      return null;
    }

    const baseUrl = this.configService.get<string>("EMAIL_LINK_BASE_URL")?.trim();
    if (!baseUrl) {
      return targetPath;
    }

    return new URL(targetPath, baseUrl).toString();
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  private async readJsonResponse(response: Response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
}
