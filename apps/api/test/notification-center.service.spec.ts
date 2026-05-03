import { NotificationCenterService } from "../src/modules/notification-center/notification-center.service";

describe("NotificationCenterService", () => {
  const repository = {
    listNotificationRecords: vi.fn(),
    markNotificationRead: vi.fn(),
    listPreferences: vi.fn(),
    upsertPreference: vi.fn(),
    createEvent: vi.fn(),
    listRecipientProfiles: vi.fn(),
    listPreferencesByEvent: vi.fn(),
    listEnabledChannelConfigs: vi.fn(),
    createNotificationRecords: vi.fn(),
    createNotificationDeliveries: vi.fn(),
    updateDeliveryResult: vi.fn(),
    updateEventStatus: vi.fn(),
    findNotificationRecordsByIds: vi.fn()
  };
  const emailAdapter = {
    channel: "EMAIL",
    adapterCode: "smtp-default",
    send: vi.fn()
  };
  const enterpriseImAdapter = {
    channel: "ENTERPRISE_IM",
    adapterCode: "enterprise-im-default",
    send: vi.fn()
  };
  const jobQueueService = {
    registerHandler: vi.fn(),
    enqueue: vi.fn().mockResolvedValue({}),
    scheduleRun: vi.fn()
  };
  const service = new NotificationCenterService(
    repository as any,
    [emailAdapter as any, enterpriseImAdapter as any],
    jobQueueService as any
  );

  beforeEach(() => {
    vi.clearAllMocks();
    enterpriseImAdapter.send.mockReset();
    service.onModuleInit();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("merges default preference templates with stored records", async () => {
    repository.listPreferences.mockResolvedValue([
      {
        id: "pref-1",
        userId: "user-1",
        domain: "OA",
        eventType: "WORKFLOW_PENDING",
        subscribed: true,
        inAppEnabled: true,
        emailEnabled: true,
        enterpriseImEnabled: false,
        digestMode: "HOURLY",
        reminderFrequencyMinutes: 60,
        nudgeThresholdMinutes: 120,
        quietHours: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      }
    ]);

    const result = await service.listPreferences({
      id: "user-1",
      username: "alice",
      displayName: "Alice",
      roleCodes: [],
      permissions: []
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "OA",
          eventType: "WORKFLOW_PENDING",
          emailEnabled: true
        }),
        expect.objectContaining({
          domain: "SCRM",
          eventType: "FOLLOW_UP_REMINDER",
          inAppEnabled: true
        })
      ])
    );
  });

  it("forces in-app delivery on while saving preferences", async () => {
    repository.upsertPreference.mockImplementation(async (input) => ({
      id: "pref-1",
      ...input,
      inAppEnabled: input.inAppEnabled,
      createdAt: new Date("2026-04-16T10:00:00.000Z"),
      updatedAt: new Date("2026-04-16T10:00:00.000Z")
    }));

    const result = await service.updatePreferences(
      {
        preferences: [
          {
            domain: "OA",
            eventType: "WORKFLOW_RESULT",
            subscribed: true,
            emailEnabled: true,
            enterpriseImEnabled: false,
            digestMode: "DAILY",
            reminderFrequencyMinutes: 1440,
            nudgeThresholdMinutes: 60,
            quietHours: {
              start: "22:00",
              end: "08:00"
            }
          }
        ]
      },
      {
        id: "user-1",
        username: "alice",
        displayName: "Alice",
        roleCodes: [],
        permissions: []
      }
    );

    expect(repository.upsertPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        inAppEnabled: true,
        emailEnabled: true
      })
    );
    expect(result[0]).toMatchObject({
      eventType: "WORKFLOW_RESULT",
      inAppEnabled: true
    });
  });

  it("routes high priority events to in-app and email when email preference is enabled", async () => {
    repository.createEvent.mockResolvedValue({
      id: "event-1",
      eventType: "WORKFLOW_PENDING",
      domain: "OA",
      title: "待审批提醒",
      summary: "报销申请等待处理",
      priority: "HIGH",
      status: "PENDING"
    });
    repository.listRecipientProfiles.mockResolvedValue([
      {
        id: "user-1",
        displayName: "Alice",
        email: "alice@example.com",
        status: "ACTIVE"
      }
    ]);
    repository.listPreferencesByEvent.mockResolvedValue([
      {
        id: "pref-1",
        userId: "user-1",
        domain: "OA",
        eventType: "WORKFLOW_PENDING",
        subscribed: true,
        inAppEnabled: true,
        emailEnabled: true,
        enterpriseImEnabled: false,
        digestMode: "IMMEDIATE",
        reminderFrequencyMinutes: null,
        nudgeThresholdMinutes: 30,
        quietHours: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      }
    ]);
    repository.listEnabledChannelConfigs.mockResolvedValue([
      {
        id: "config-1",
        channel: "EMAIL",
        adapterCode: "smtp-default",
        provider: "smtp",
        displayName: "默认邮件",
        description: null,
        isEnabled: true,
        config: null,
        capabilities: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      }
    ]);
    repository.createNotificationRecords.mockResolvedValue([
      {
        id: "record-1",
        eventId: "event-1",
        recipientId: "user-1",
        domain: "OA",
        eventType: "WORKFLOW_PENDING",
        title: "待审批提醒",
        summary: "报销申请等待处理",
        priority: "HIGH",
        status: "UNREAD",
        targetPath: "/oa/approvals/pending",
        targetLabel: "进入审批",
        channelPreferences: null,
        routingSnapshot: null,
        deliveredAt: new Date("2026-04-16T10:00:00.000Z"),
        readAt: null,
        archivedAt: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z"),
        deliveries: []
      }
    ]);
    repository.createNotificationDeliveries.mockResolvedValue([
      {
        id: "delivery-1",
        notificationId: "record-1",
        channel: "IN_APP",
        adapterCode: null,
        provider: null,
        status: "SENT",
        externalMessageId: null,
        attemptCount: 1,
        payload: null,
        response: null,
        errorMessage: null,
        lastAttemptedAt: new Date("2026-04-16T10:00:00.000Z"),
        sentAt: new Date("2026-04-16T10:00:00.000Z"),
        failedAt: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      },
      {
        id: "delivery-2",
        notificationId: "record-1",
        channel: "EMAIL",
        adapterCode: "smtp-default",
        provider: "smtp",
        status: "PENDING",
        externalMessageId: null,
        attemptCount: 0,
        payload: null,
        response: null,
        errorMessage: null,
        lastAttemptedAt: null,
        sentAt: null,
        failedAt: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      }
    ]);
    emailAdapter.send.mockResolvedValue({
      status: "SENT",
      externalMessageId: "email:record-1",
      response: {
        provider: "mock-smtp"
      }
    });
    repository.updateDeliveryResult.mockResolvedValue(undefined);
    repository.updateEventStatus.mockResolvedValue(undefined);
    repository.findNotificationRecordsByIds.mockResolvedValue([
      {
        id: "record-1",
        eventId: "event-1",
        recipientId: "user-1",
        domain: "OA",
        eventType: "WORKFLOW_PENDING",
        title: "待审批提醒",
        summary: "报销申请等待处理",
        priority: "HIGH",
        status: "UNREAD",
        targetPath: "/oa/approvals/pending",
        targetLabel: "进入审批",
        channelPreferences: {
          inAppEnabled: true,
          emailEnabled: true
        },
        routingSnapshot: {
          channels: ["IN_APP", "EMAIL"]
        },
        deliveredAt: new Date("2026-04-16T10:00:00.000Z"),
        readAt: null,
        archivedAt: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z"),
        deliveries: [
          {
            id: "delivery-1",
            channel: "IN_APP",
            adapterCode: null,
            provider: null,
            status: "SENT",
            externalMessageId: null,
            attemptCount: 1,
            payload: null,
            response: null,
            errorMessage: null,
            lastAttemptedAt: new Date("2026-04-16T10:00:00.000Z"),
            sentAt: new Date("2026-04-16T10:00:00.000Z"),
            failedAt: null,
            createdAt: new Date("2026-04-16T10:00:00.000Z"),
            updatedAt: new Date("2026-04-16T10:00:00.000Z")
          },
          {
            id: "delivery-2",
            channel: "EMAIL",
            adapterCode: "smtp-default",
            provider: "smtp",
            status: "SENT",
            externalMessageId: "email:record-1",
            attemptCount: 1,
            payload: null,
            response: null,
            errorMessage: null,
            lastAttemptedAt: new Date("2026-04-16T10:00:00.000Z"),
            sentAt: new Date("2026-04-16T10:00:00.000Z"),
            failedAt: null,
            createdAt: new Date("2026-04-16T10:00:00.000Z"),
            updatedAt: new Date("2026-04-16T10:00:00.000Z")
          }
        ]
      }
    ]);

    const result = await service.publishEvent({
      event: {
        eventType: "WORKFLOW_PENDING",
        domain: "OA",
        sourceType: "workflow-task",
        sourceId: "task-1",
        title: "待审批提醒",
        summary: "报销申请等待处理",
        priority: "HIGH",
        payload: {
          taskId: "task-1"
        },
        targetPath: "/oa/approvals/pending",
        targetLabel: "进入审批",
        occurredAt: new Date("2026-04-16T10:00:00.000Z")
      },
      recipientIds: ["user-1"]
    });

    expect(repository.createNotificationDeliveries).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          channel: "IN_APP",
          status: "SENT"
        }),
        expect.objectContaining({
          channel: "EMAIL",
          adapterCode: "smtp-default"
        })
      ])
    );
    expect(jobQueueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "notification.delivery",
        correlationId: "delivery-2"
      })
    );
    const handler = jobQueueService.registerHandler.mock.calls.find((call) => call[0] === "notification.delivery")?.[1];
    await handler({
      payload: jobQueueService.enqueue.mock.calls[0][0].payload,
      attempts: 1
    });
    expect(emailAdapter.send).toHaveBeenCalledTimes(1);
    expect(result.notifications[0]).toMatchObject({
      eventType: "WORKFLOW_PENDING"
    });
  });

  it("uses nudge threshold to escalate medium priority events to email", async () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-16T12:00:00.000Z").getTime());
    repository.createEvent.mockResolvedValue({
      id: "event-2",
      eventType: "FOLLOW_UP_REMINDER",
      domain: "SCRM",
      title: "客户跟进催办",
      summary: "客户已经超过跟进阈值",
      priority: "MEDIUM",
      status: "PENDING"
    });
    repository.listRecipientProfiles.mockResolvedValue([
      {
        id: "user-2",
        displayName: "Bob",
        email: "bob@example.com",
        status: "ACTIVE"
      }
    ]);
    repository.listPreferencesByEvent.mockResolvedValue([
      {
        id: "pref-2",
        userId: "user-2",
        domain: "SCRM",
        eventType: "FOLLOW_UP_REMINDER",
        subscribed: true,
        inAppEnabled: true,
        emailEnabled: true,
        enterpriseImEnabled: false,
        digestMode: "IMMEDIATE",
        reminderFrequencyMinutes: null,
        nudgeThresholdMinutes: 30,
        quietHours: null,
        createdAt: new Date("2026-04-16T09:00:00.000Z"),
        updatedAt: new Date("2026-04-16T09:00:00.000Z")
      }
    ]);
    repository.listEnabledChannelConfigs.mockResolvedValue([
      {
        id: "config-1",
        channel: "EMAIL",
        adapterCode: "smtp-default",
        provider: "smtp",
        displayName: "默认邮件",
        description: null,
        isEnabled: true,
        config: null,
        capabilities: null,
        createdAt: new Date("2026-04-16T09:00:00.000Z"),
        updatedAt: new Date("2026-04-16T09:00:00.000Z")
      }
    ]);
    repository.createNotificationRecords.mockResolvedValue([
      {
        id: "record-2",
        eventId: "event-2",
        recipientId: "user-2",
        domain: "SCRM",
        eventType: "FOLLOW_UP_REMINDER",
        title: "客户跟进催办",
        summary: "客户已经超过跟进阈值",
        priority: "MEDIUM",
        status: "UNREAD",
        targetPath: "/scrm/customers",
        targetLabel: "进入客户列表",
        channelPreferences: null,
        routingSnapshot: null,
        deliveredAt: new Date("2026-04-16T12:00:00.000Z"),
        readAt: null,
        archivedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z"),
        deliveries: []
      }
    ]);
    repository.createNotificationDeliveries.mockResolvedValue([
      {
        id: "delivery-3",
        notificationId: "record-2",
        channel: "IN_APP",
        adapterCode: null,
        provider: null,
        status: "SENT",
        externalMessageId: null,
        attemptCount: 1,
        payload: null,
        response: null,
        errorMessage: null,
        lastAttemptedAt: new Date("2026-04-16T12:00:00.000Z"),
        sentAt: new Date("2026-04-16T12:00:00.000Z"),
        failedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z")
      },
      {
        id: "delivery-4",
        notificationId: "record-2",
        channel: "EMAIL",
        adapterCode: "smtp-default",
        provider: "smtp",
        status: "PENDING",
        externalMessageId: null,
        attemptCount: 0,
        payload: null,
        response: null,
        errorMessage: null,
        lastAttemptedAt: null,
        sentAt: null,
        failedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z")
      }
    ]);
    emailAdapter.send.mockResolvedValue({
      status: "SENT",
      externalMessageId: "email:record-2",
      response: {
        provider: "mock-smtp"
      }
    });
    repository.updateDeliveryResult.mockResolvedValue(undefined);
    repository.updateEventStatus.mockResolvedValue(undefined);
    repository.findNotificationRecordsByIds.mockResolvedValue([
      {
        id: "record-2",
        eventId: "event-2",
        recipientId: "user-2",
        domain: "SCRM",
        eventType: "FOLLOW_UP_REMINDER",
        title: "客户跟进催办",
        summary: "客户已经超过跟进阈值",
        priority: "MEDIUM",
        status: "UNREAD",
        targetPath: "/scrm/customers",
        targetLabel: "进入客户列表",
        channelPreferences: {
          inAppEnabled: true,
          emailEnabled: true
        },
        routingSnapshot: {
          channels: ["IN_APP", "EMAIL"],
          nudgeThresholdMinutes: 30
        },
        deliveredAt: new Date("2026-04-16T12:00:00.000Z"),
        readAt: null,
        archivedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z"),
        deliveries: []
      }
    ]);

    await service.publishEvent({
      event: {
        eventType: "FOLLOW_UP_REMINDER",
        domain: "SCRM",
        sourceType: "reminder",
        sourceId: "reminder-1",
        title: "客户跟进催办",
        summary: "客户已经超过跟进阈值",
        priority: "MEDIUM",
        payload: {
          reminderId: "reminder-1"
        },
        targetPath: "/scrm/customers",
        targetLabel: "进入客户列表",
        occurredAt: new Date("2026-04-16T12:00:00.000Z")
      },
      recipientIds: ["user-2"],
      nudgeBaseAt: new Date("2026-04-16T11:00:00.000Z")
    });

    expect(jobQueueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "notification.delivery",
        correlationId: "delivery-4"
      })
    );
    const handler = jobQueueService.registerHandler.mock.calls.find((call) => call[0] === "notification.delivery")?.[1];
    await handler({
      payload: jobQueueService.enqueue.mock.calls[0][0].payload,
      attempts: 1
    });
    expect(emailAdapter.send).toHaveBeenCalledTimes(1);
    expect(repository.createNotificationDeliveries).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          channel: "EMAIL"
        })
      ])
    );
  });

  it("queues external notification deliveries and executes them through the registered worker handler", async () => {
    repository.createEvent.mockResolvedValue({
      id: "event-3",
      eventType: "WORKFLOW_RESULT",
      domain: "OA",
      title: "审批结果通知",
      summary: "审批已完成",
      priority: "HIGH",
      status: "PENDING"
    });
    repository.listRecipientProfiles.mockResolvedValue([
      {
        id: "user-3",
        displayName: "Carol",
        email: "carol@example.com",
        status: "ACTIVE"
      }
    ]);
    repository.listPreferencesByEvent.mockResolvedValue([
      {
        id: "pref-3",
        userId: "user-3",
        domain: "OA",
        eventType: "WORKFLOW_RESULT",
        subscribed: true,
        inAppEnabled: true,
        emailEnabled: true,
        enterpriseImEnabled: false,
        digestMode: "IMMEDIATE",
        reminderFrequencyMinutes: null,
        nudgeThresholdMinutes: null,
        quietHours: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      }
    ]);
    repository.listEnabledChannelConfigs.mockResolvedValue([
      {
        id: "config-1",
        channel: "EMAIL",
        adapterCode: "smtp-default",
        provider: "smtp",
        displayName: "默认邮件",
        description: null,
        isEnabled: true,
        config: null,
        capabilities: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      }
    ]);
    repository.createNotificationRecords.mockResolvedValue([
      {
        id: "record-3",
        eventId: "event-3",
        recipientId: "user-3",
        domain: "OA",
        eventType: "WORKFLOW_RESULT",
        title: "审批结果通知",
        summary: "审批已完成",
        priority: "HIGH",
        status: "UNREAD",
        targetPath: "/oa/approvals/history",
        targetLabel: "查看结果",
        channelPreferences: null,
        routingSnapshot: null,
        deliveredAt: new Date("2026-04-16T12:00:00.000Z"),
        readAt: null,
        archivedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z"),
        deliveries: []
      }
    ]);
    repository.createNotificationDeliveries.mockResolvedValue([
      {
        id: "delivery-5",
        notificationId: "record-3",
        channel: "IN_APP",
        adapterCode: null,
        provider: null,
        status: "SENT",
        externalMessageId: null,
        attemptCount: 1,
        payload: null,
        response: null,
        errorMessage: null,
        lastAttemptedAt: new Date("2026-04-16T12:00:00.000Z"),
        sentAt: new Date("2026-04-16T12:00:00.000Z"),
        failedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z")
      },
      {
        id: "delivery-6",
        notificationId: "record-3",
        channel: "EMAIL",
        adapterCode: "smtp-default",
        provider: "smtp",
        status: "PENDING",
        externalMessageId: null,
        attemptCount: 0,
        payload: null,
        response: null,
        errorMessage: null,
        lastAttemptedAt: null,
        sentAt: null,
        failedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z")
      }
    ]);
    repository.updateEventStatus.mockResolvedValue(undefined);
    repository.findNotificationRecordsByIds.mockResolvedValue([]);
    repository.updateDeliveryResult.mockResolvedValue(undefined);
    emailAdapter.send.mockResolvedValue({
      status: "SENT",
      externalMessageId: "email:record-3",
      response: {
        provider: "mock-smtp"
      }
    });

    await service.publishEvent({
      event: {
        eventType: "WORKFLOW_RESULT",
        domain: "OA",
        sourceType: "workflow-task",
        sourceId: "task-3",
        title: "审批结果通知",
        summary: "审批已完成",
        priority: "HIGH",
        payload: {},
        targetPath: "/oa/approvals/history",
        targetLabel: "查看结果",
        occurredAt: new Date("2026-04-16T12:00:00.000Z")
      },
      recipientIds: ["user-3"]
    });

    expect(jobQueueService.registerHandler).toHaveBeenCalledWith("notification.delivery", expect.any(Function));
    expect(jobQueueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "notification.delivery",
        correlationId: "delivery-6"
      })
    );
    expect(jobQueueService.scheduleRun).toHaveBeenCalledWith(["notification.delivery"]);

    const handler = jobQueueService.registerHandler.mock.calls.find((call) => call[0] === "notification.delivery")?.[1];
    await handler({
      payload: jobQueueService.enqueue.mock.calls[0][0].payload,
      attempts: 1
    });

    expect(emailAdapter.send).toHaveBeenCalled();
    expect(repository.updateDeliveryResult).toHaveBeenCalledWith(
      "delivery-6",
      expect.objectContaining({
        status: "SENT",
        attemptCount: 1
      })
    );
  });

  it("routes enterprise im delivery when the preference and channel config are enabled", async () => {
    repository.createEvent.mockResolvedValue({
      id: "event-im-1",
      eventType: "GOVERNANCE_ALERT",
      domain: "PLATFORM",
      title: "治理告警",
      summary: "请立即处理。",
      priority: "CRITICAL",
      status: "PENDING"
    });
    repository.listRecipientProfiles.mockResolvedValue([
      {
        id: "user-im-1",
        displayName: "Dora",
        email: "dora@example.com",
        status: "ACTIVE"
      }
    ]);
    repository.listPreferencesByEvent.mockResolvedValue([
      {
        id: "pref-im-1",
        userId: "user-im-1",
        domain: "PLATFORM",
        eventType: "GOVERNANCE_ALERT",
        subscribed: true,
        inAppEnabled: true,
        emailEnabled: false,
        enterpriseImEnabled: true,
        digestMode: "IMMEDIATE",
        reminderFrequencyMinutes: null,
        nudgeThresholdMinutes: null,
        quietHours: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      }
    ]);
    repository.listEnabledChannelConfigs.mockResolvedValue([
      {
        id: "config-im-1",
        channel: "ENTERPRISE_IM",
        adapterCode: "enterprise-im-default",
        provider: "wecom",
        displayName: "企业 IM",
        description: null,
        isEnabled: true,
        config: null,
        capabilities: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      }
    ]);
    repository.createNotificationRecords.mockResolvedValue([
      {
        id: "record-im-1",
        eventId: "event-im-1",
        recipientId: "user-im-1",
        domain: "PLATFORM",
        eventType: "GOVERNANCE_ALERT",
        title: "治理告警",
        summary: "请立即处理。",
        priority: "CRITICAL",
        status: "UNREAD",
        targetPath: "/system",
        targetLabel: "查看详情",
        channelPreferences: null,
        routingSnapshot: null,
        deliveredAt: new Date("2026-04-16T12:00:00.000Z"),
        readAt: null,
        archivedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z"),
        deliveries: []
      }
    ]);
    repository.createNotificationDeliveries.mockResolvedValue([
      {
        id: "delivery-im-1",
        notificationId: "record-im-1",
        channel: "IN_APP",
        adapterCode: null,
        provider: null,
        status: "SENT",
        externalMessageId: null,
        attemptCount: 1,
        payload: null,
        response: null,
        errorMessage: null,
        lastAttemptedAt: new Date("2026-04-16T12:00:00.000Z"),
        sentAt: new Date("2026-04-16T12:00:00.000Z"),
        failedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z")
      },
      {
        id: "delivery-im-2",
        notificationId: "record-im-1",
        channel: "ENTERPRISE_IM",
        adapterCode: "enterprise-im-default",
        provider: "wecom",
        status: "PENDING",
        externalMessageId: null,
        attemptCount: 0,
        payload: null,
        response: null,
        errorMessage: null,
        lastAttemptedAt: null,
        sentAt: null,
        failedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z")
      }
    ]);
    repository.updateDeliveryResult.mockResolvedValue(undefined);
    repository.updateEventStatus.mockResolvedValue(undefined);
    repository.findNotificationRecordsByIds.mockResolvedValue([]);
    enterpriseImAdapter.send.mockResolvedValue({
      status: "SENT",
      externalMessageId: "enterprise-im:record-im-1",
      response: {
        provider: "wecom"
      }
    });

    await service.publishEvent({
      event: {
        eventType: "GOVERNANCE_ALERT",
        domain: "PLATFORM",
        sourceType: "scheduler-job",
        sourceId: "job-1",
        title: "治理告警",
        summary: "请立即处理。",
        priority: "CRITICAL",
        payload: {},
        targetPath: "/system",
        targetLabel: "查看详情",
        occurredAt: new Date("2026-04-16T12:00:00.000Z")
      },
      recipientIds: ["user-im-1"]
    });

    const handler = jobQueueService.registerHandler.mock.calls.find((call) => call[0] === "notification.delivery")?.[1];
    await handler({
      payload: jobQueueService.enqueue.mock.calls[0][0].payload,
      attempts: 1
    });

    expect(enterpriseImAdapter.send).toHaveBeenCalledTimes(1);
    expect(repository.createNotificationDeliveries).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          channel: "ENTERPRISE_IM",
          adapterCode: "enterprise-im-default"
        })
      ])
    );
  });

  it("forces password reset notifications to use email even when user email preference is disabled", async () => {
    repository.createEvent.mockResolvedValue({
      id: "event-reset-1",
      eventType: "PASSWORD_RESET_REQUESTED",
      domain: "PLATFORM",
      title: "密码重置请求",
      summary: "请完成密码重置。",
      priority: "HIGH",
      status: "PENDING"
    });
    repository.listRecipientProfiles.mockResolvedValue([
      {
        id: "user-reset-1",
        displayName: "Alice",
        email: "alice@example.com",
        status: "ACTIVE"
      }
    ]);
    repository.listPreferencesByEvent.mockResolvedValue([
      {
        id: "pref-reset-1",
        userId: "user-reset-1",
        domain: "PLATFORM",
        eventType: "PASSWORD_RESET_REQUESTED",
        subscribed: true,
        inAppEnabled: true,
        emailEnabled: false,
        enterpriseImEnabled: false,
        digestMode: "IMMEDIATE",
        reminderFrequencyMinutes: null,
        nudgeThresholdMinutes: null,
        quietHours: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      }
    ]);
    repository.listEnabledChannelConfigs.mockResolvedValue([
      {
        id: "config-reset-1",
        channel: "EMAIL",
        adapterCode: "smtp-default",
        provider: "smtp",
        displayName: "默认邮件",
        description: null,
        isEnabled: true,
        config: null,
        capabilities: null,
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        updatedAt: new Date("2026-04-16T10:00:00.000Z")
      }
    ]);
    repository.createNotificationRecords.mockResolvedValue([
      {
        id: "record-reset-1",
        eventId: "event-reset-1",
        recipientId: "user-reset-1",
        domain: "PLATFORM",
        eventType: "PASSWORD_RESET_REQUESTED",
        title: "密码重置请求",
        summary: "请完成密码重置。",
        priority: "HIGH",
        status: "UNREAD",
        targetPath: "/auth/password-reset?token=abc",
        targetLabel: "重置密码",
        channelPreferences: null,
        routingSnapshot: null,
        deliveredAt: new Date("2026-04-16T12:00:00.000Z"),
        readAt: null,
        archivedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z"),
        deliveries: []
      }
    ]);
    repository.createNotificationDeliveries.mockResolvedValue([
      {
        id: "delivery-reset-1",
        notificationId: "record-reset-1",
        channel: "IN_APP",
        adapterCode: null,
        provider: null,
        status: "SENT",
        externalMessageId: null,
        attemptCount: 1,
        payload: null,
        response: null,
        errorMessage: null,
        lastAttemptedAt: new Date("2026-04-16T12:00:00.000Z"),
        sentAt: new Date("2026-04-16T12:00:00.000Z"),
        failedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z")
      },
      {
        id: "delivery-reset-2",
        notificationId: "record-reset-1",
        channel: "EMAIL",
        adapterCode: "smtp-default",
        provider: "smtp",
        status: "PENDING",
        externalMessageId: null,
        attemptCount: 0,
        payload: null,
        response: null,
        errorMessage: null,
        lastAttemptedAt: null,
        sentAt: null,
        failedAt: null,
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z")
      }
    ]);
    repository.updateDeliveryResult.mockResolvedValue(undefined);
    repository.updateEventStatus.mockResolvedValue(undefined);
    repository.findNotificationRecordsByIds.mockResolvedValue([]);
    emailAdapter.send.mockResolvedValue({
      status: "SENT",
      externalMessageId: "email:record-reset-1",
      response: {
        provider: "resend"
      }
    });

    await service.publishEvent({
      event: {
        eventType: "PASSWORD_RESET_REQUESTED",
        domain: "PLATFORM",
        sourceType: "auth-password-reset",
        sourceId: "user-reset-1",
        title: "密码重置请求",
        summary: "请完成密码重置。",
        priority: "HIGH",
        requiredChannels: ["EMAIL"],
        payload: {
          resetToken: "abc",
          resetUrl: "https://portal.example.com/auth/password-reset?token=abc"
        },
        targetPath: "/auth/password-reset?token=abc",
        targetLabel: "重置密码",
        occurredAt: new Date("2026-04-16T12:00:00.000Z")
      },
      recipientIds: ["user-reset-1"]
    });

    expect(repository.createNotificationDeliveries).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          channel: "EMAIL",
          adapterCode: "smtp-default"
        })
      ])
    );
  });
});
