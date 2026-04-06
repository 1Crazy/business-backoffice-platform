import { OfficeAutomationService } from "../src/modules/office-automation/office-automation.service";

const LeaveRequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED"
} as const;

type LeaveRequestStatus = (typeof LeaveRequestStatus)[keyof typeof LeaveRequestStatus];

const ApprovalActionDecision = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
} as const;

type ApprovalActionDecision = (typeof ApprovalActionDecision)[keyof typeof ApprovalActionDecision];

describe("OfficeAutomationService", () => {
  const mockRepository = {
    findDefaultApprover: jest.fn(),
    findSelfApprover: jest.fn(),
    createLeaveRequest: jest.fn(),
    findLeaveRequestById: jest.fn(),
    applyApprovalDecision: jest.fn(),
    countPendingApprovals: jest.fn(),
    countMyLeaveRequests: jest.fn(),
    countActiveAnnouncements: jest.fn(),
    countActiveDepartments: jest.fn(),
    listRecentAnnouncements: jest.fn()
  };
  const mockAuditLogs = {
    create: jest.fn()
  };

  const service = new OfficeAutomationService(mockRepository as any, mockAuditLogs as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a leave request and records audit log", async () => {
    mockRepository.findDefaultApprover.mockResolvedValue({ id: "approver-1", displayName: "Bob" });
    const createdAt = new Date();
    const record = {
      id: "leave-1",
      leaveType: "ANNUAL",
      startAt: new Date("2026-04-01T08:00:00Z"),
      endAt: new Date("2026-04-02T18:00:00Z"),
      reason: "旅行",
      status: "PENDING" as LeaveRequestStatus,
      applicant: { displayName: "Alice" },
      approver: { displayName: "Bob" },
      actions: [
        {
          comment: "initial"
        }
      ],
      createdAt,
      updatedAt: createdAt
    };
    mockRepository.createLeaveRequest.mockResolvedValue(record as any);

    const result = await service.createLeaveRequest(
      {
        leaveType: "ANNUAL",
        startAt: "2026-04-01 08:00:00",
        endAt: "2026-04-02 18:00:00",
        reason: "旅行"
      },
      {
        id: "user-1",
        username: "alice",
        displayName: "Alice",
        roleCodes: ["scrm-user"],
        permissions: []
      }
    );

    expect(mockRepository.findDefaultApprover).toHaveBeenCalled();
    expect(mockRepository.createLeaveRequest).toHaveBeenCalled();
    expect(mockAuditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "oa-leave-request",
        targetId: record.id
      })
    );
    expect(result).toMatchObject({
      applicantName: "Alice",
      currentApproverName: "Bob",
      latestComment: "initial"
    });
  });

  it("processes leave approval when actor is assigned approver", async () => {
    mockRepository.findLeaveRequestById.mockResolvedValue({
      id: "leave-2",
      approver: {
        id: "approver-2",
        displayName: "Carol"
      },
      status: LeaveRequestStatus.PENDING
    } as any);
    mockRepository.applyApprovalDecision.mockResolvedValue({
      id: "leave-2",
      leaveType: "SICK",
      startAt: new Date("2026-04-05T09:00:00Z"),
      endAt: new Date("2026-04-05T17:00:00Z"),
      reason: "体检",
      status: "APPROVED" as LeaveRequestStatus,
      applicant: { displayName: "Alice" },
      approver: { displayName: "Carol" },
      actions: [
        {
          comment: "同意",
          createdAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);

    const result = await service.decideLeaveRequest(
      "leave-2",
      {
        decision: ApprovalActionDecision.APPROVED,
        comment: "同意"
      },
      {
        id: "approver-2",
        username: "carol",
        displayName: "Carol",
        roleCodes: ["oa-approver"],
        permissions: []
      }
    );

    expect(mockRepository.findLeaveRequestById).toHaveBeenCalledWith("leave-2");
    expect(mockRepository.applyApprovalDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "leave-2",
        status: LeaveRequestStatus.APPROVED
      })
    );
    expect(mockAuditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "oa-leave-request",
        actionType: "UPDATE"
      })
    );
    expect(result.status).toBe(LeaveRequestStatus.APPROVED);
  });
});
