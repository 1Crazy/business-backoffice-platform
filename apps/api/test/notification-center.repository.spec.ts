import { NotificationCenterRepository } from "../src/modules/notification-center/repositories/notification-center.repository";

describe("NotificationCenterRepository", () => {
  it("creates a normalized notification event with default priority fallback", async () => {
    const createdEvent = {
      id: "event-1",
      eventType: "WORKFLOW_APPROVED",
      domain: "OA",
      sourceType: "workflow-instance",
      sourceId: "instance-1",
      title: "审批已通过",
      summary: "报销申请已通过",
      priority: "MEDIUM",
      status: "PENDING",
      payload: {
        instanceId: "instance-1"
      },
      metadata: null,
      targetPath: "/oa/approvals/instance-1",
      targetLabel: "查看审批",
      actorId: "user-1",
      occurredAt: new Date("2026-04-16T10:00:00.000Z"),
      createdAt: new Date("2026-04-16T10:00:01.000Z"),
      updatedAt: new Date("2026-04-16T10:00:01.000Z")
    };
    const prisma = {
      notificationEvent: {
        create: jest.fn().mockResolvedValue(createdEvent)
      }
    } as any;
    const repository = new NotificationCenterRepository(prisma);

    const result = await repository.createEvent({
      eventType: "WORKFLOW_APPROVED",
      domain: "OA",
      sourceType: "workflow-instance",
      sourceId: "instance-1",
      title: "审批已通过",
      summary: "报销申请已通过",
      payload: {
        instanceId: "instance-1"
      },
      targetPath: "/oa/approvals/instance-1",
      targetLabel: "查看审批",
      actorId: "user-1",
      occurredAt: new Date("2026-04-16T10:00:00.000Z")
    });

    expect(prisma.notificationEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "WORKFLOW_APPROVED",
          domain: "OA",
          priority: "MEDIUM"
        })
      })
    );
    expect(result).toEqual(createdEvent);
  });

  it("creates notification records in a single transaction", async () => {
    const prisma = {
      notificationRecord: {
        create: jest
          .fn()
          .mockResolvedValueOnce({
            id: "record-1",
            eventId: "event-1",
            recipientId: "user-1",
            domain: "OA",
            eventType: "WORKFLOW_APPROVED"
          })
          .mockResolvedValueOnce({
            id: "record-2",
            eventId: "event-1",
            recipientId: "user-2",
            domain: "OA",
            eventType: "WORKFLOW_APPROVED"
          })
      },
      $transaction: jest.fn().mockImplementation(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
    } as any;
    const repository = new NotificationCenterRepository(prisma);

    const result = await repository.createNotificationRecords([
      {
        eventId: "event-1",
        recipientId: "user-1",
        domain: "OA",
        eventType: "WORKFLOW_APPROVED",
        title: "审批已通过",
        routingSnapshot: {
          channels: ["IN_APP"]
        }
      },
      {
        eventId: "event-1",
        recipientId: "user-2",
        domain: "OA",
        eventType: "WORKFLOW_APPROVED",
        title: "审批已通过",
        channelPreferences: {
          inAppEnabled: true
        }
      }
    ]);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.notificationRecord.create).toHaveBeenCalledTimes(2);
    expect(prisma.notificationRecord.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          recipientId: "user-1",
          routingSnapshot: {
            channels: ["IN_APP"]
          }
        })
      })
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: "record-1"
      }),
      expect.objectContaining({
        id: "record-2"
      })
    ]);
  });

  it("upserts notification preferences with the composite unique key", async () => {
    const updatedPreference = {
      id: "preference-1",
      userId: "user-1",
      domain: "OA",
      eventType: "WORKFLOW_PENDING",
      subscribed: true,
      inAppEnabled: true,
      emailEnabled: true,
      enterpriseImEnabled: false,
      digestMode: "HOURLY",
      reminderFrequencyMinutes: 60,
      nudgeThresholdMinutes: 180,
      quietHours: {
        start: "22:00",
        end: "08:00"
      },
      createdAt: new Date("2026-04-16T09:00:00.000Z"),
      updatedAt: new Date("2026-04-16T10:00:00.000Z")
    };
    const prisma = {
      notificationPreference: {
        upsert: jest.fn().mockResolvedValue(updatedPreference)
      }
    } as any;
    const repository = new NotificationCenterRepository(prisma);

    const result = await repository.upsertPreference({
      userId: "user-1",
      domain: "OA",
      eventType: "WORKFLOW_PENDING",
      subscribed: true,
      inAppEnabled: true,
      emailEnabled: true,
      enterpriseImEnabled: false,
      digestMode: "HOURLY",
      reminderFrequencyMinutes: 60,
      nudgeThresholdMinutes: 180,
      quietHours: {
        start: "22:00",
        end: "08:00"
      }
    });

    expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_domain_eventType: {
            userId: "user-1",
            domain: "OA",
            eventType: "WORKFLOW_PENDING"
          }
        },
        update: expect.objectContaining({
          emailEnabled: true,
          digestMode: "HOURLY"
        }),
        create: expect.objectContaining({
          userId: "user-1",
          eventType: "WORKFLOW_PENDING"
        })
      })
    );
    expect(result).toEqual(updatedPreference);
  });

  it("lists only enabled external channel configs in stable order", async () => {
    const prisma = {
      notificationChannelConfig: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "config-1",
            channel: "EMAIL",
            adapterCode: "smtp-default",
            provider: "smtp",
            displayName: "默认邮件通道",
            description: null,
            isEnabled: true,
            config: null,
            capabilities: {
              supportsDigest: true
            },
            createdAt: new Date("2026-04-16T10:00:00.000Z"),
            updatedAt: new Date("2026-04-16T10:00:00.000Z")
          }
        ])
      }
    } as any;
    const repository = new NotificationCenterRepository(prisma);

    const result = await repository.listEnabledChannelConfigs();

    expect(prisma.notificationChannelConfig.findMany).toHaveBeenCalledWith({
      where: {
        isEnabled: true
      },
      select: expect.any(Object),
      orderBy: [
        {
          channel: "asc"
        },
        {
          displayName: "asc"
        }
      ]
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: "config-1",
        adapterCode: "smtp-default"
      })
    ]);
  });
});
