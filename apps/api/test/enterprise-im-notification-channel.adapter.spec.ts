import { EnterpriseImNotificationChannelAdapter } from "../src/modules/notification-center/adapters/enterprise-im-notification-channel.adapter";

describe("EnterpriseImNotificationChannelAdapter", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fails outside local runtimes when enterprise im webhook is missing", async () => {
    const adapter = new EnterpriseImNotificationChannelAdapter({
      get: vi.fn((key: string, fallback?: string) => {
        const values: Record<string, string> = {
          NODE_ENV: "production"
        };
        return values[key] ?? fallback;
      })
    } as any);

    const result = await adapter.send({
      notificationId: "notification-1",
      eventType: "GOVERNANCE_ALERT",
      domain: "PLATFORM",
      title: "治理告警",
      priority: "CRITICAL",
      recipientId: "user-1"
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "FAILED",
        errorMessage: expect.stringContaining("Webhook")
      })
    );
  });

  it("sends markdown messages through the configured webhook", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        errcode: 0
      })
    });
    const adapter = new EnterpriseImNotificationChannelAdapter({
      get: vi.fn((key: string, fallback?: string) => {
        const values: Record<string, string> = {
          NODE_ENV: "production",
          ENTERPRISE_IM_WEBHOOK_URL: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=test",
          ENTERPRISE_IM_WEBHOOK_SECRET: "secret-key",
          ENTERPRISE_IM_LINK_BASE_URL: "https://portal.example.com"
        };
        return values[key] ?? fallback;
      })
    } as any);

    const result = await adapter.send({
      notificationId: "notification-2",
      eventType: "GOVERNANCE_ALERT",
      domain: "PLATFORM",
      title: "治理告警",
      summary: "需要处理治理风险。",
      priority: "CRITICAL",
      recipientId: "user-1",
      targetPath: "/system",
      targetLabel: "查看详情"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://qyapi.weixin.qq.com/cgi-bin/webhook/send"),
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: "SENT",
        externalMessageId: "enterprise-im:notification-2"
      })
    );
  });
});
