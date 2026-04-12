/** OA repository：负责 OA 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import {
  AdministrativeRequestActionType,
  AdministrativeRequestStatus,
  AdministrativeRequestType,
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

const administrativeRequestActionInclude = Prisma.validator<Prisma.AdministrativeRequestActionInclude>()({
  actor: {
    select: {
      id: true,
      displayName: true
    }
  }
});

const administrativeRequestInclude = Prisma.validator<Prisma.AdministrativeRequestInclude>()({
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
    include: administrativeRequestActionInclude,
    orderBy: {
      createdAt: "desc"
    }
  }
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

export type AdministrativeRequestRecord = Prisma.AdministrativeRequestGetPayload<{
  include: typeof administrativeRequestInclude;
}>;

@Injectable()
export class OfficeAutomationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDefaultApprover(applicantId: string, permissionCode = "oa:approval:write") {
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
                    code: permissionCode
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

  async findSelfApprover(applicantId: string, permissionCode = "oa:approval:write") {
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
                    code: permissionCode
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

  async createAdministrativeRequest(input: {
    requestNo: string;
    type: AdministrativeRequestType;
    title: string;
    summary: string;
    reason: string;
    formData: Prisma.InputJsonValue;
    attachmentNames?: Prisma.InputJsonValue;
    applicantId: string;
    approverId: string;
  }) {
    const request = await this.prisma.administrativeRequest.create({
      data: {
        requestNo: input.requestNo,
        type: input.type,
        title: input.title,
        summary: input.summary,
        reason: input.reason,
        formData: input.formData,
        attachmentNames: input.attachmentNames,
        applicantId: input.applicantId,
        approverId: input.approverId,
        actions: {
          create: {
            actorId: input.applicantId,
            actionType: AdministrativeRequestActionType.SUBMITTED,
            snapshot: input.formData
          }
        }
      }
    });

    return this.findAdministrativeRequestById(request.id);
  }

  findLeaveRequestById(id: string) {
    return this.prisma.leaveRequest.findUniqueOrThrow({
      where: { id },
      include: leaveRequestInclude
    });
  }

  findAdministrativeRequestById(id: string) {
    return this.prisma.administrativeRequest.findUniqueOrThrow({
      where: { id },
      include: administrativeRequestInclude
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

  async applyAdministrativeApprovalDecision(input: {
    requestId: string;
    actorId: string;
    status: AdministrativeRequestStatus;
    comment?: string;
  }) {
    const actionType =
      input.status === AdministrativeRequestStatus.APPROVED
        ? AdministrativeRequestActionType.APPROVED
        : AdministrativeRequestActionType.REJECTED;

    await this.prisma.$transaction(async (tx) => {
      await tx.administrativeRequest.update({
        where: {
          id: input.requestId
        },
        data: {
          status: input.status,
          decidedAt: new Date()
        }
      });

      await tx.administrativeRequestAction.create({
        data: {
          requestId: input.requestId,
          actorId: input.actorId,
          actionType,
          comment: input.comment
        }
      });
    });

    return this.findAdministrativeRequestById(input.requestId);
  }

  async applyAdministrativeCancellation(input: {
    requestId: string;
    actorId: string;
  }) {
    await this.prisma.$transaction(async (tx) => {
      await tx.administrativeRequest.update({
        where: {
          id: input.requestId
        },
        data: {
          status: AdministrativeRequestStatus.CANCELLED,
          decidedAt: new Date()
        }
      });

      await tx.administrativeRequestAction.create({
        data: {
          requestId: input.requestId,
          actorId: input.actorId,
          actionType: AdministrativeRequestActionType.CANCELLED
        }
      });
    });

    return this.findAdministrativeRequestById(input.requestId);
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

  listPendingAdministrativeApprovals(approverId: string) {
    return this.prisma.administrativeRequest.findMany({
      where: {
        approverId,
        status: AdministrativeRequestStatus.PENDING
      },
      include: administrativeRequestInclude,
      orderBy: [
        {
          submittedAt: "desc"
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

  listMyAdministrativeRequests(applicantId: string) {
    return this.prisma.administrativeRequest.findMany({
      where: {
        applicantId
      },
      include: administrativeRequestInclude,
      orderBy: [
        {
          submittedAt: "desc"
        }
      ]
    });
  }

  listAdministrativeRequests(where: Prisma.AdministrativeRequestWhereInput) {
    return this.prisma.administrativeRequest.findMany({
      where,
      include: administrativeRequestInclude,
      orderBy: [
        {
          submittedAt: "desc"
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

  countPendingAdministrativeApprovals(approverId: string) {
    return this.prisma.administrativeRequest.count({
      where: {
        approverId,
        status: AdministrativeRequestStatus.PENDING
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

  countMyAdministrativeRequests(applicantId: string) {
    return this.prisma.administrativeRequest.count({
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
