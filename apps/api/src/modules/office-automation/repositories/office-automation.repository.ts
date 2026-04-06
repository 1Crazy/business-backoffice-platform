/** OA repository：负责 OA 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import {
  ApprovalActionDecision,
  LeaveRequestStatus,
  Prisma,
  RecordStatus,
  UserStatus
} from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const announcementInclude = Prisma.validator<Prisma.AnnouncementInclude>()({
  publishedBy: {
    select: {
      id: true,
      displayName: true
    }
  }
});

const leaveRequestInclude = Prisma.validator<Prisma.LeaveRequestInclude>()({
  applicant: {
    select: {
      id: true,
      displayName: true
    }
  },
  approver: {
    select: {
      id: true,
      displayName: true
    }
  },
  actions: {
    include: {
      actor: {
        select: {
          id: true,
          displayName: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  }
});

const directoryMemberSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  username: true,
  displayName: true,
  email: true,
  phone: true,
  department: {
    select: {
      id: true,
      name: true
    }
  }
});

const directoryDepartmentSelect = Prisma.validator<Prisma.DepartmentSelect>()({
  id: true,
  name: true,
  code: true
});

export type AnnouncementRecord = Prisma.AnnouncementGetPayload<{
  include: typeof announcementInclude;
}>;

export type LeaveRequestRecord = Prisma.LeaveRequestGetPayload<{
  include: typeof leaveRequestInclude;
}>;

export type DirectoryMemberRecord = Prisma.UserGetPayload<{
  select: typeof directoryMemberSelect;
}>;

export type DirectoryDepartmentRecord = Prisma.DepartmentGetPayload<{
  select: typeof directoryDepartmentSelect;
}>;

@Injectable()
export class OfficeAutomationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDefaultApprover(applicantId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: {
          not: applicantId
        },
        status: UserStatus.ACTIVE,
        roles: {
          some: {
            role: {
              permissions: {
                some: {
                  permission: {
                    code: "oa:approval:write"
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true
      }
    });
  }

  async findSelfApprover(applicantId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: applicantId,
        status: UserStatus.ACTIVE,
        roles: {
          some: {
            role: {
              permissions: {
                some: {
                  permission: {
                    code: "oa:approval:write"
                  }
                }
              }
            }
          }
        }
      },
      select: {
        id: true
      }
    });
  }

  async createLeaveRequest(input: {
    applicantId: string;
    approverId: string;
    leaveType: string;
    startAt: Date;
    endAt: Date;
    reason: string;
  }) {
    const request = await this.prisma.leaveRequest.create({
      data: {
        applicantId: input.applicantId,
        approverId: input.approverId,
        leaveType: input.leaveType,
        startAt: input.startAt,
        endAt: input.endAt,
        reason: input.reason
      }
    });

    return this.findLeaveRequestById(request.id);
  }

  findLeaveRequestById(id: string) {
    return this.prisma.leaveRequest.findUniqueOrThrow({
      where: { id },
      include: leaveRequestInclude
    });
  }

  async applyApprovalDecision(input: {
    requestId: string;
    actorId: string;
    status: LeaveRequestStatus;
    comment?: string;
  }) {
    const decision =
      input.status === LeaveRequestStatus.APPROVED
        ? ApprovalActionDecision.APPROVED
        : ApprovalActionDecision.REJECTED;

    await this.prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: {
          id: input.requestId
        },
        data: {
          status: input.status
        }
      });

      await tx.leaveApprovalAction.create({
        data: {
          leaveRequestId: input.requestId,
          actorId: input.actorId,
          decision,
          comment: input.comment
        }
      });
    });

    return this.findLeaveRequestById(input.requestId);
  }

  listPendingApprovals(approverId: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        approverId,
        status: LeaveRequestStatus.PENDING
      },
      include: leaveRequestInclude,
      orderBy: [
        {
          createdAt: "desc"
        }
      ]
    });
  }

  listMyLeaveRequests(applicantId: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        applicantId
      },
      include: leaveRequestInclude,
      orderBy: [
        {
          createdAt: "desc"
        }
      ]
    });
  }

  countPendingApprovals(approverId: string) {
    return this.prisma.leaveRequest.count({
      where: {
        approverId,
        status: LeaveRequestStatus.PENDING
      }
    });
  }

  countMyLeaveRequests(applicantId: string) {
    return this.prisma.leaveRequest.count({
      where: {
        applicantId
      }
    });
  }

  listRecentAnnouncements(limit: number) {
    return this.prisma.announcement.findMany({
      where: {
        status: RecordStatus.ACTIVE
      },
      include: announcementInclude,
      orderBy: [
        {
          publishedAt: "desc"
        }
      ],
      take: limit
    });
  }

  listAnnouncements() {
    return this.prisma.announcement.findMany({
      where: {
        status: RecordStatus.ACTIVE
      },
      include: announcementInclude,
      orderBy: [
        {
          publishedAt: "desc"
        }
      ]
    });
  }

  findAnnouncementById(id: string) {
    return this.prisma.announcement.findFirstOrThrow({
      where: {
        id,
        status: RecordStatus.ACTIVE
      },
      include: announcementInclude
    });
  }

  countActiveAnnouncements() {
    return this.prisma.announcement.count({
      where: {
        status: RecordStatus.ACTIVE
      }
    });
  }

  listActiveDepartments() {
    return this.prisma.department.findMany({
      where: {
        status: RecordStatus.ACTIVE
      },
      select: directoryDepartmentSelect,
      orderBy: [
        {
          createdAt: "asc"
        }
      ]
    });
  }

  countActiveDepartments() {
    return this.prisma.department.count({
      where: {
        status: RecordStatus.ACTIVE
      }
    });
  }

  listDirectoryMembers(departmentId?: string) {
    return this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        departmentId
      },
      select: directoryMemberSelect,
      orderBy: [
        {
          displayName: "asc"
        }
      ]
    });
  }
}
