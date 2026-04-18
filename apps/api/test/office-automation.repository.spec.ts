import {
  ApprovalActionDecision,
  LeaveRequestStatus,
  RecordStatus,
  UserStatus
} from "@prisma/client";

import { OfficeAutomationRepository } from "../src/modules/office-automation/repositories/office-automation.repository";

describe("OfficeAutomationRepository", () => {
  it("scopes leave approval updates by request id and tenant id", async () => {
    const tx = {
      leaveRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      leaveApprovalAction: {
        create: jest.fn().mockResolvedValue(undefined)
      }
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx))
    } as any;
    const repository = new OfficeAutomationRepository(prisma);

    jest.spyOn(repository, "findLeaveRequestById").mockResolvedValue({ id: "leave-1" } as any);

    await repository.applyApprovalDecision({
      tenantId: "tenant-1",
      requestId: "leave-1",
      actorId: "approver-1",
      status: LeaveRequestStatus.APPROVED,
      comment: "同意"
    });

    expect(tx.leaveRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: "leave-1",
        tenantId: "tenant-1"
      },
      data: {
        status: LeaveRequestStatus.APPROVED
      }
    });
    expect(tx.leaveApprovalAction.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        leaveRequestId: "leave-1",
        actorId: "approver-1",
        decision: ApprovalActionDecision.APPROVED,
        comment: "同意"
      }
    });
  });

  it("reads announcements only from the current tenant", async () => {
    const prisma = {
      announcement: {
        findFirstOrThrow: jest.fn().mockResolvedValue({ id: "announcement-1" })
      }
    } as any;
    const repository = new OfficeAutomationRepository(prisma);

    await repository.findAnnouncementById("announcement-1", "tenant-1");

    expect(prisma.announcement.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        id: "announcement-1",
        tenantId: "tenant-1",
        status: RecordStatus.ACTIVE
      },
      include: expect.any(Object)
    });
  });

  it("reads directory members only from the current tenant and department", async () => {
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([])
      }
    } as any;
    const repository = new OfficeAutomationRepository(prisma);

    await repository.listDirectoryMembers("tenant-1", "dept-1");

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant-1",
        status: UserStatus.ACTIVE,
        departmentId: "dept-1"
      },
      select: expect.any(Object),
      orderBy: [
        {
          displayName: "asc"
        }
      ]
    });
  });
});
