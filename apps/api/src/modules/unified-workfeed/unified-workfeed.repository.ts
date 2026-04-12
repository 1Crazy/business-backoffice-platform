import { Injectable } from "@nestjs/common";
import {
  AdministrativeRequestStatus,
  LeaveRequestStatus,
  Prisma,
  RecordStatus,
  ReminderStatus,
  RenewalReminderStatus
} from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const leaveApprovalSelect = Prisma.validator<Prisma.LeaveRequestSelect>()({
  id: true,
  leaveType: true,
  startAt: true,
  endAt: true,
  reason: true,
  status: true,
  createdAt: true,
  applicant: {
    select: {
      id: true,
      displayName: true
    }
  }
});

const administrativeApprovalSelect = Prisma.validator<Prisma.AdministrativeRequestSelect>()({
  id: true,
  requestNo: true,
  type: true,
  title: true,
  summary: true,
  status: true,
  submittedAt: true,
  updatedAt: true,
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
  }
});

const leaveResultSelect = Prisma.validator<Prisma.LeaveRequestSelect>()({
  ...leaveApprovalSelect,
  updatedAt: true,
  approver: {
    select: {
      id: true,
      displayName: true
    }
  }
});

const reminderInclude = Prisma.validator<Prisma.ReminderInclude>()({
  lead: {
    select: {
      id: true,
      name: true
    }
  },
  customer: {
    select: {
      id: true,
      name: true
    }
  },
  followUp: {
    select: {
      id: true,
      content: true
    }
  }
});

const renewalReminderInclude = Prisma.validator<Prisma.RenewalReminderInclude>()({
  customer: {
    select: {
      id: true,
      name: true
    }
  },
  opportunity: {
    select: {
      id: true,
      name: true
    }
  },
  contract: {
    select: {
      id: true,
      title: true
    }
  }
});

const announcementInclude = Prisma.validator<Prisma.AnnouncementInclude>()({
  publishedBy: {
    select: {
      id: true,
      displayName: true
    }
  }
});

const notificationReadSelect = Prisma.validator<Prisma.WorkfeedNotificationReadSelect>()({
  notificationType: true,
  sourceId: true,
  readAt: true
});

export type LeaveApprovalTodoRecord = Prisma.LeaveRequestGetPayload<{ select: typeof leaveApprovalSelect }>;
export type LeaveResultRecord = Prisma.LeaveRequestGetPayload<{ select: typeof leaveResultSelect }>;
export type AdministrativeApprovalTodoRecord = Prisma.AdministrativeRequestGetPayload<{
  select: typeof administrativeApprovalSelect;
}>;
export type ReminderFeedRecord = Prisma.ReminderGetPayload<{ include: typeof reminderInclude }>;
export type RenewalReminderFeedRecord = Prisma.RenewalReminderGetPayload<{ include: typeof renewalReminderInclude }>;
export type AnnouncementFeedRecord = Prisma.AnnouncementGetPayload<{ include: typeof announcementInclude }>;
export type NotificationReadRecord = Prisma.WorkfeedNotificationReadGetPayload<{ select: typeof notificationReadSelect }>;

@Injectable()
export class UnifiedWorkfeedRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPendingLeaveApprovals(approverId: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        approverId,
        status: LeaveRequestStatus.PENDING
      },
      select: leaveApprovalSelect,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  listPendingAdministrativeApprovals(approverId: string) {
    return this.prisma.administrativeRequest.findMany({
      where: {
        approverId,
        status: AdministrativeRequestStatus.PENDING
      },
      select: administrativeApprovalSelect,
      orderBy: {
        submittedAt: "desc"
      }
    });
  }

  listApplicantLeaveResults(applicantId: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        applicantId,
        status: {
          in: [LeaveRequestStatus.APPROVED, LeaveRequestStatus.REJECTED, LeaveRequestStatus.CANCELLED]
        }
      },
      select: leaveResultSelect,
      orderBy: {
        updatedAt: "desc"
      },
      take: 20
    });
  }

  listApplicantAdministrativeResults(applicantId: string) {
    return this.prisma.administrativeRequest.findMany({
      where: {
        applicantId,
        status: {
          in: [
            AdministrativeRequestStatus.APPROVED,
            AdministrativeRequestStatus.REJECTED,
            AdministrativeRequestStatus.CANCELLED
          ]
        }
      },
      select: administrativeApprovalSelect,
      orderBy: {
        updatedAt: "desc"
      },
      take: 20
    });
  }

  listPendingReminders(ownerId: string) {
    return this.prisma.reminder.findMany({
      where: {
        ownerId,
        status: ReminderStatus.PENDING
      },
      include: reminderInclude,
      orderBy: {
        remindAt: "asc"
      },
      take: 30
    });
  }

  listPendingRenewalReminders(ownerId: string) {
    return this.prisma.renewalReminder.findMany({
      where: {
        ownerId,
        status: RenewalReminderStatus.PENDING
      },
      include: renewalReminderInclude,
      orderBy: {
        remindAt: "asc"
      },
      take: 30
    });
  }

  listActiveAnnouncements(limit = 20) {
    return this.prisma.announcement.findMany({
      where: {
        status: RecordStatus.ACTIVE
      },
      include: announcementInclude,
      orderBy: {
        publishedAt: "desc"
      },
      take: limit
    });
  }

  listNotificationReadStates(userId: string, sources: Array<{ notificationType: string; sourceId: string }>) {
    if (sources.length === 0) {
      return Promise.resolve([] as NotificationReadRecord[]);
    }

    return this.prisma.workfeedNotificationRead.findMany({
      where: {
        userId,
        OR: sources.map((item) => ({
          notificationType: item.notificationType,
          sourceId: item.sourceId
        }))
      },
      select: notificationReadSelect
    });
  }

  markNotificationRead(userId: string, notificationType: string, sourceId: string) {
    return this.prisma.workfeedNotificationRead.upsert({
      where: {
        userId_notificationType_sourceId: {
          userId,
          notificationType,
          sourceId
        }
      },
      update: {
        readAt: new Date()
      },
      create: {
        userId,
        notificationType,
        sourceId,
        readAt: new Date()
      }
    });
  }
}
