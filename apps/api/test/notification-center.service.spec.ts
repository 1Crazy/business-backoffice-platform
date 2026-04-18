import { NotificationCenterService } from "../src/modules/notification-center/notification-center.service";

describe("NotificationCenterService", () => {
  const repository = {
    listNotificationRecords: jest.fn(),
    markNotificationRead: jest.fn(),
    listPreferences: jest.fn(),
    upsertPreference: jest.fn(),
    createEvent: jest.fn(),
    listRecipientProfiles: jest.fn(),
    listPreferencesByEvent: jest.fn(),
    listEnabledChannelConfigs: jest.fn(),
    createNotificationRecords: jest.fn(),
    createNotificationDeliveries: jest.fn(),
    updateDeliveryResult: jest.fn(),
    updateEventStatus: jest.fn(),
    findNotificationRecordsByIds: jest.fn()
  };
  const emailAdapter = {
    channel: "EMAIL",
    adapterCode: "smtp-default",
    send: jest.fn()
  };
  const service = new NotificationCenterService(repository as any, [emailAdapter as any]);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    expect(emailAdapter.send).toHaveBeenCalledTimes(1);
    expect(result.notifications[0]).toMatchObject({
      eventType: "WORKFLOW_PENDING"
    });
  });

  it("uses nudge threshold to escalate medium priority events to email", async () => {
    jest.spyOn(Date, "now").mockReturnValue(new Date("2026-04-16T12:00:00.000Z").getTime());
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

    expect(emailAdapter.send).toHaveBeenCalledTimes(1);
    expect(repository.createNotificationDeliveries).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          channel: "EMAIL"
        })
      ])
    );
  });
});
