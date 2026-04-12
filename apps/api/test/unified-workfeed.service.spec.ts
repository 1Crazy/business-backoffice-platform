import { UnifiedWorkfeedService } from "../src/modules/unified-workfeed/unified-workfeed.service";

describe("UnifiedWorkfeedService", () => {
  const repository = {
    listPendingLeaveApprovals: jest.fn(),
    listPendingAdministrativeApprovals: jest.fn(),
    listPendingReminders: jest.fn(),
    listPendingRenewalReminders: jest.fn(),
    listApplicantLeaveResults: jest.fn(),
    listApplicantAdministrativeResults: jest.fn(),
    listActiveAnnouncements: jest.fn(),
    listNotificationReadStates: jest.fn(),
    markNotificationRead: jest.fn()
  };

  const service = new UnifiedWorkfeedService(repository as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("aggregates todos and notifications with filter and read state handling", async () => {
    repository.listPendingLeaveApprovals.mockResolvedValue([
      {
        id: "leave-1",
        leaveType: "年假",
        startAt: new Date("2026-04-12T09:00:00.000Z"),
        endAt: new Date("2026-04-12T18:00:00.000Z"),
        reason: "调休",
        status: "PENDING",
        createdAt: new Date("2026-04-11T09:00:00.000Z"),
        applicant: {
          id: "user-2",
          displayName: "Alice"
        }
      }
    ]);
    repository.listPendingAdministrativeApprovals.mockResolvedValue([]);
    repository.listPendingReminders.mockResolvedValue([]);
    repository.listPendingRenewalReminders.mockResolvedValue([]);
    repository.listApplicantLeaveResults.mockResolvedValue([]);
    repository.listApplicantAdministrativeResults.mockResolvedValue([
      {
        id: "admin-1",
        requestNo: "BX-001",
        type: "REIMBURSEMENT",
        title: "差旅报销",
        summary: "杭州差旅 1280 元",
        status: "APPROVED",
        submittedAt: new Date("2026-04-10T09:00:00.000Z"),
        updatedAt: new Date("2026-04-11T10:00:00.000Z"),
        applicant: {
          id: "user-1",
          displayName: "Bob"
        },
        approver: {
          id: "approver-1",
          displayName: "Carol"
        }
      }
    ]);
    repository.listActiveAnnouncements.mockResolvedValue([
      {
        id: "announcement-1",
        title: "五一值班安排",
        summary: "请相关同学提前确认值班表。",
        publishedAt: new Date("2026-04-09T08:00:00.000Z"),
        publishedBy: {
          id: "user-9",
          displayName: "行政部"
        }
      }
    ]);
    repository.listNotificationReadStates.mockResolvedValue([
      {
        notificationType: "ADMINISTRATIVE_RESULT",
        sourceId: "admin-1",
        readAt: new Date("2026-04-11T12:00:00.000Z")
      }
    ]);

    const todos = await service.listTodos(
      {
        domain: "oa"
      },
      {
        id: "user-1",
        username: "bob",
        displayName: "Bob",
        roleCodes: ["oa-member"],
        permissions: []
      }
    );
    const notifications = await service.listNotifications(
      {
        unreadOnly: true
      },
      {
        id: "user-1",
        username: "bob",
        displayName: "Bob",
        roleCodes: ["oa-member"],
        permissions: []
      }
    );

    expect(todos).toHaveLength(1);
    expect(todos[0]).toMatchObject({
      domain: "oa",
      type: "LEAVE_APPROVAL",
      targetPath: "/oa/approvals/pending"
    });
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      type: "ANNOUNCEMENT",
      isRead: false
    });
  });
});
