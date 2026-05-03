import { EmailNotificationChannelAdapter } from "../src/modules/notification-center/adapters/email-notification-channel.adapter";

describe("EmailNotificationChannelAdapter", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not mark mock delivery as sent outside local runtimes by default", async () => {
    const adapter = new EmailNotificationChannelAdapter({
      get: vi.fn((key: string, fallback?: string) => {
        const values: Record<string, string> = {
          NODE_ENV: "production"
        };
        return values[key] ?? fallback;
      })
    } as any);

    const result = await adapter.send({
      notificationId: "notification-1",
      eventType: "WORKFLOW_RESULT",
      domain: "OA",
      title: "审批结果",
      priority: "HIGH",
      recipientId: "user-1",
      recipientDisplayName: "Alice",
      recipientEmail: "alice@example.com"
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "FAILED",
        errorMessage: expect.stringContaining("provider")
      })
    );
  });

  it("allows mock delivery in local runtimes", async () => {
    const adapter = new EmailNotificationChannelAdapter({
      get: vi.fn((key: string, fallback?: string) => {
        const values: Record<string, string> = {
          NODE_ENV: "test"
        };
        return values[key] ?? fallback;
      })
    } as any);

    const result = await adapter.send({
      notificationId: "notification-2",
      eventType: "WORKFLOW_RESULT",
      domain: "OA",
      title: "审批结果",
      priority: "HIGH",
      recipientId: "user-1",
      recipientDisplayName: "Alice",
      recipientEmail: "alice@example.com"
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "SENT",
        externalMessageId: "email:notification-2"
      })
    );
  });

  it("sends email through the configured resend provider", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: "resend-message-1"
      })
    });
    const adapter = new EmailNotificationChannelAdapter({
      get: vi.fn((key: string, fallback?: string) => {
        const values: Record<string, string> = {
          NODE_ENV: "production",
          EMAIL_DELIVERY_PROVIDER: "resend",
          EMAIL_RESEND_API_KEY: "resend-key",
          EMAIL_FROM_ADDRESS: "noreply@example.com",
          EMAIL_LINK_BASE_URL: "https://portal.example.com"
        };
        return values[key] ?? fallback;
      })
    } as any);

    const result = await adapter.send({
      notificationId: "notification-3",
      eventType: "PASSWORD_RESET_REQUESTED",
      domain: "PLATFORM",
      title: "密码重置请求",
      summary: "请完成密码重置。",
      priority: "HIGH",
      recipientId: "user-1",
      recipientDisplayName: "Alice",
      recipientEmail: "alice@example.com",
      payload: {
        resetUrl: "https://portal.example.com/auth/password-reset?token=abc"
      }
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: "SENT",
        externalMessageId: "resend-message-1"
      })
    );
  });
});
