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

const AdministrativeRequestType = {
  REIMBURSEMENT: "REIMBURSEMENT",
  TRAVEL: "TRAVEL",
  PURCHASE: "PURCHASE",
  SEAL: "SEAL"
} as const;

type AdministrativeRequestType = (typeof AdministrativeRequestType)[keyof typeof AdministrativeRequestType];

const AdministrativeRequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED"
} as const;

type AdministrativeRequestStatus =
  (typeof AdministrativeRequestStatus)[keyof typeof AdministrativeRequestStatus];

describe("OfficeAutomationService", () => {
  const mockRepository = {
    findDefaultApprover: jest.fn(),
    findSelfApprover: jest.fn(),
    createLeaveRequest: jest.fn(),
    createAdministrativeRequest: jest.fn(),
    findLeaveRequestById: jest.fn(),
    findAdministrativeRequestById: jest.fn(),
    applyApprovalDecision: jest.fn(),
    applyAdministrativeApprovalDecision: jest.fn(),
    applyAdministrativeCancellation: jest.fn(),
    countPendingApprovals: jest.fn(),
    countPendingAdministrativeApprovals: jest.fn(),
    countMyLeaveRequests: jest.fn(),
    countMyAdministrativeRequests: jest.fn(),
    countActiveAnnouncements: jest.fn(),
    countActiveDepartments: jest.fn(),
    listRecentAnnouncements: jest.fn(),
    listAnnouncements: jest.fn(),
    findAnnouncementById: jest.fn(),
    listActiveDepartments: jest.fn(),
    listDirectoryMembers: jest.fn(),
    listMyAdministrativeRequests: jest.fn(),
    listPendingAdministrativeApprovals: jest.fn()
  };
  const mockAuditLogs = {
    create: jest.fn()
  };
  const mockNotificationCenter = {
    publishEvent: jest.fn().mockResolvedValue(undefined)
  };

  const service = new OfficeAutomationService(
    mockRepository as any,
    mockAuditLogs as any,
    mockNotificationCenter as any
  );

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
        tenantId: "tenant-1",
        username: "alice",
        displayName: "Alice",
        roleCodes: ["scrm-user"],
        permissions: []
      }
    );

    expect(mockRepository.findDefaultApprover).toHaveBeenCalledWith("user-1", "tenant-1", "oa:approval:write");
    expect(mockRepository.createLeaveRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        applicantId: "user-1",
        approverId: "approver-1"
      })
    );
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
      applicant: { id: "user-1", displayName: "Alice" },
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
        tenantId: "tenant-1",
        username: "carol",
        displayName: "Carol",
        roleCodes: ["oa-approver"],
        permissions: []
      }
    );

    expect(mockRepository.findLeaveRequestById).toHaveBeenCalledWith("leave-2", "tenant-1");
    expect(mockRepository.applyApprovalDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
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
    expect(mockNotificationCenter.publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          eventType: "LEAVE_RESULT"
        })
      })
    );
    expect(result.status).toBe(LeaveRequestStatus.APPROVED);
  });

  it("creates an administrative request and records audit log", async () => {
    mockRepository.findDefaultApprover.mockResolvedValue({ id: "approver-1" });
    mockRepository.createAdministrativeRequest.mockResolvedValue({
      id: "admin-request-1",
      requestNo: "BX-20260411-101010",
      type: AdministrativeRequestType.REIMBURSEMENT,
      title: "客户拜访报销",
      summary: "差旅交通，1280.00 元",
      reason: "补充客户拜访期间的交通与住宿报销。",
      status: AdministrativeRequestStatus.PENDING,
      attachmentNames: ["发票.pdf"],
      applicant: { displayName: "Alice" },
      approver: { displayName: "Bob" },
      actions: [],
      submittedAt: new Date("2026-04-11T10:10:10.000Z"),
      decidedAt: null,
      createdAt: new Date("2026-04-11T10:10:10.000Z"),
      updatedAt: new Date("2026-04-11T10:10:10.000Z")
    } as any);

    const result = await service.createAdministrativeRequest(
      {
        type: AdministrativeRequestType.REIMBURSEMENT,
        title: "客户拜访报销",
        reason: "补充客户拜访期间的交通与住宿报销。",
        expenseDate: "2026-04-10",
        expenseCategory: "差旅交通",
        amount: 1280,
        payeeName: "Alice",
        attachmentNames: ["发票.pdf"]
      },
      {
        id: "user-1",
        tenantId: "tenant-1",
        username: "alice",
        displayName: "Alice",
        roleCodes: ["oa-member"],
        permissions: ["oa:request:apply"]
      }
    );

    expect(mockRepository.findDefaultApprover).toHaveBeenCalledWith("user-1", "tenant-1", "oa:request:approve");
    expect(mockRepository.createAdministrativeRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        type: AdministrativeRequestType.REIMBURSEMENT,
        applicantId: "user-1",
        approverId: "approver-1"
      })
    );
    expect(mockAuditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "oa-administrative-request",
        targetId: "admin-request-1"
      })
    );
    expect(result.requestNo).toBe("BX-20260411-101010");
  });

  it("processes administrative approval when actor is assigned approver", async () => {
    mockRepository.findAdministrativeRequestById.mockResolvedValue({
      id: "admin-request-2",
      applicantId: "user-1",
      approverId: "approver-2",
      approver: {
        id: "approver-2",
        displayName: "Carol"
      },
      status: AdministrativeRequestStatus.PENDING
    } as any);
    mockRepository.applyAdministrativeApprovalDecision.mockResolvedValue({
      id: "admin-request-2",
      requestNo: "CC-20260411-121212",
      type: AdministrativeRequestType.TRAVEL,
      title: "上海出差申请",
      summary: "上海，2026-04-15 至 2026-04-16",
      reason: "客户现场需求澄清。",
      status: AdministrativeRequestStatus.APPROVED,
      attachmentNames: [],
      applicant: { displayName: "Alice" },
      approver: { displayName: "Carol" },
      actions: [
        {
          comment: "同意",
          createdAt: new Date()
        }
      ],
      submittedAt: new Date("2026-04-11T12:12:12.000Z"),
      decidedAt: new Date("2026-04-11T14:00:00.000Z"),
      createdAt: new Date("2026-04-11T12:12:12.000Z"),
      updatedAt: new Date("2026-04-11T14:00:00.000Z")
    } as any);

    const result = await service.decideAdministrativeRequest(
      "admin-request-2",
      {
        decision: ApprovalActionDecision.APPROVED,
        comment: "同意"
      },
      {
        id: "approver-2",
        tenantId: "tenant-1",
        username: "carol",
        displayName: "Carol",
        roleCodes: ["oa-approver"],
        permissions: ["oa:request:approve"]
      }
    );

    expect(mockRepository.findAdministrativeRequestById).toHaveBeenCalledWith("admin-request-2", "tenant-1");
    expect(mockRepository.applyAdministrativeApprovalDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        requestId: "admin-request-2",
        status: AdministrativeRequestStatus.APPROVED
      })
    );
    expect(mockAuditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "oa-administrative-request",
        actionType: "UPDATE"
      })
    );
    expect(result.status).toBe(AdministrativeRequestStatus.APPROVED);
  });

  it("allows applicant to cancel a pending administrative request", async () => {
    mockRepository.findAdministrativeRequestById.mockResolvedValue({
      id: "admin-request-3",
      requestNo: "CG-20260411-151515",
      applicant: {
        id: "user-1",
        displayName: "Alice"
      },
      status: AdministrativeRequestStatus.PENDING
    } as any);
    mockRepository.applyAdministrativeCancellation.mockResolvedValue({
      id: "admin-request-3",
      requestNo: "CG-20260411-151515",
      type: AdministrativeRequestType.PURCHASE,
      title: "直播设备采购申请",
      summary: "补光灯 / 3 件 / ¥1580.00",
      reason: "补充直播间设备。",
      status: AdministrativeRequestStatus.CANCELLED,
      attachmentNames: [],
      applicant: { displayName: "Alice" },
      approver: { displayName: "Carol" },
      actions: [
        {
          actionType: "CANCELLED",
          createdAt: new Date()
        }
      ],
      submittedAt: new Date("2026-04-11T15:15:15.000Z"),
      decidedAt: new Date("2026-04-11T15:30:00.000Z"),
      createdAt: new Date("2026-04-11T15:15:15.000Z"),
      updatedAt: new Date("2026-04-11T15:30:00.000Z")
    } as any);

    const result = await service.cancelAdministrativeRequest("admin-request-3", {
      id: "user-1",
      tenantId: "tenant-1",
      username: "alice",
      displayName: "Alice",
      roleCodes: ["oa-member"],
      permissions: ["oa:request:apply"]
    });

    expect(mockRepository.findAdministrativeRequestById).toHaveBeenCalledWith("admin-request-3", "tenant-1");
    expect(mockRepository.applyAdministrativeCancellation).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      requestId: "admin-request-3",
      actorId: "user-1"
    });
    expect(mockAuditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "oa-administrative-request",
        actionType: "UPDATE",
        detail: expect.objectContaining({
          decision: "CANCELLED"
        })
      })
    );
    expect(result.status).toBe(AdministrativeRequestStatus.CANCELLED);
  });

  it("loads announcements and directory inside current tenant", async () => {
    mockRepository.listAnnouncements.mockResolvedValue([]);
    mockRepository.listActiveDepartments.mockResolvedValue([]);
    mockRepository.listDirectoryMembers.mockResolvedValue([]);

    await service.getAnnouncements({
      id: "user-1",
      tenantId: "tenant-1",
      username: "alice",
      displayName: "Alice",
      roleCodes: ["oa-member"],
      permissions: ["oa:announcement:read", "oa:directory:read"]
    });

    await service.getDirectorySnapshot(
      {
        id: "user-1",
        tenantId: "tenant-1",
        username: "alice",
        displayName: "Alice",
        roleCodes: ["oa-member"],
        permissions: ["oa:directory:read"]
      },
      "dept-1"
    );

    expect(mockRepository.listAnnouncements).toHaveBeenCalledWith("tenant-1");
    expect(mockRepository.listActiveDepartments).toHaveBeenCalledWith("tenant-1");
    expect(mockRepository.listDirectoryMembers).toHaveBeenCalledWith("tenant-1", "dept-1");
  });
});
