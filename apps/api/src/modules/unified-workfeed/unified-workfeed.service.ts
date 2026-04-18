import { Injectable } from "@nestjs/common";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { toIsoString } from "@/common/mappers/date-time.mapper";
import {
  type NotificationRecordEntity,
  NotificationCenterRepository
} from "../notification-center/repositories/notification-center.repository";
import { ListWorkfeedNotificationsDto } from "./dto/list-workfeed-notifications.dto";
import { ListWorkfeedTodosDto } from "./dto/list-workfeed-todos.dto";
import { MarkWorkfeedNotificationReadDto } from "./dto/mark-workfeed-notification-read.dto";
import {
  type AdministrativeApprovalTodoRecord,
  type AnnouncementFeedRecord,
  type LeaveApprovalTodoRecord,
  type LeaveResultRecord,
  type ReminderFeedRecord,
  type RenewalReminderFeedRecord,
  UnifiedWorkfeedRepository
} from "./repositories/unified-workfeed.repository";
import type {
  WorkfeedDomain,
  WorkfeedNotificationType,
  WorkfeedPriority,
  WorkfeedTodoType
} from "./unified-workfeed.constants";

type WorkfeedTodoItem = {
  id: string;
  domain: WorkfeedDomain;
  type: WorkfeedTodoType;
  title: string;
  summary: string | null;
  priority: WorkfeedPriority;
  dueAt: string | null;
  status: string;
  targetPath: string;
  targetLabel: string;
  sourceId: string;
  createdAt: string;
};

type WorkfeedNotificationItem = {
  id: string;
  domain: WorkfeedDomain;
  type: WorkfeedNotificationType;
  title: string;
  summary: string | null;
  priority: WorkfeedPriority;
  targetPath: string;
  targetLabel: string;
  sourceId: string;
  occurredAt: string;
  isRead: boolean;
  readAt: string | null;
};

@Injectable()
export class UnifiedWorkfeedService {
  constructor(
    private readonly unifiedWorkfeedRepository: UnifiedWorkfeedRepository,
    private readonly notificationCenterRepository: NotificationCenterRepository
  ) {}

  async listTodos(query: ListWorkfeedTodosDto, actor: AuthUser) {
    const [leaveApprovals, administrativeApprovals, reminders, renewalReminders] = await Promise.all([
      this.unifiedWorkfeedRepository.listPendingLeaveApprovals(actor.id),
      this.unifiedWorkfeedRepository.listPendingAdministrativeApprovals(actor.id),
      this.unifiedWorkfeedRepository.listPendingReminders(actor.id),
      this.unifiedWorkfeedRepository.listPendingRenewalReminders(actor.id)
    ]);

    return [
      ...leaveApprovals.map((item) => this.mapLeaveApprovalTodo(item)),
      ...administrativeApprovals.map((item) => this.mapAdministrativeApprovalTodo(item)),
      ...reminders.map((item) => this.mapReminderTodo(item)),
      ...renewalReminders.map((item) => this.mapRenewalReminderTodo(item))
    ]
      .filter((item) => (query.domain ? item.domain === query.domain : true))
      .filter((item) => (query.type ? item.type === query.type : true))
      .filter((item) => (query.priority ? item.priority === query.priority : true))
      .sort((left, right) => this.sortByDueDate(left, right));
  }

  async listNotifications(query: ListWorkfeedNotificationsDto, actor: AuthUser) {
    const [notificationRecords, announcements] = await Promise.all([
      this.notificationCenterRepository.listNotificationRecords({
        recipientId: actor.id,
        unreadOnly: query.unreadOnly
      }),
      this.unifiedWorkfeedRepository.listActiveAnnouncements()
    ]);

    const notificationItems = notificationRecords
      .filter((item) => this.isSupportedNotificationEventType(item.eventType))
      .map((item) => this.mapNotificationCenterNotification(item));
    const announcementItems = announcements.map((item) => this.mapAnnouncementNotification(item));
    const readStates = await this.unifiedWorkfeedRepository.listNotificationReadStates(
      actor.id,
      announcementItems.map((item) => ({
        notificationType: item.type,
        sourceId: item.sourceId
      }))
    );
    const readStateMap = new Map(
      readStates.map((item: { notificationType: string; sourceId: string; readAt: Date }) => [
        `${item.notificationType}:${item.sourceId}`,
        toIsoString(item.readAt) ?? null
      ])
    );
    const resolvedAnnouncementItems: WorkfeedNotificationItem[] = announcementItems.map((item) => {
      const readAt = readStateMap.get(`${item.type}:${item.sourceId}`) ?? null;

      return {
        ...item,
        isRead: readAt !== null,
        readAt
      };
    });
    const resolvedItems: WorkfeedNotificationItem[] = [...notificationItems, ...resolvedAnnouncementItems];

    return resolvedItems
      .filter((item) => (query.domain ? item.domain === query.domain : true))
      .filter((item) => (query.type ? item.type === query.type : true))
      .filter((item) => (query.unreadOnly ? !item.isRead : true))
      .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
  }

  async markNotificationRead(dto: MarkWorkfeedNotificationReadDto, actor: AuthUser) {
    if (dto.notificationType !== "ANNOUNCEMENT") {
      const record = await this.notificationCenterRepository.markNotificationRead(dto.sourceId, actor.id);

      return {
        notificationType: dto.notificationType,
        sourceId: dto.sourceId,
        readAt: toIsoString(record.readAt) ?? null
      };
    }

    const record = await this.unifiedWorkfeedRepository.markNotificationRead(actor.id, dto.notificationType, dto.sourceId);

    return {
      notificationType: dto.notificationType,
      sourceId: dto.sourceId,
      readAt: toIsoString(record.readAt) ?? null
    };
  }

  private mapLeaveApprovalTodo(record: LeaveApprovalTodoRecord): WorkfeedTodoItem {
    return {
      id: `leave-approval:${record.id}`,
      domain: "oa",
      type: "LEAVE_APPROVAL",
      title: `${record.applicant.displayName}的${record.leaveType}审批`,
      summary: record.reason,
      priority: "HIGH",
      dueAt: toIsoString(record.startAt) ?? null,
      status: record.status,
      targetPath: "/oa/approvals/pending",
      targetLabel: "进入待我审批",
      sourceId: record.id,
      createdAt: toIsoString(record.createdAt)!
    };
  }

  private mapAdministrativeApprovalTodo(record: AdministrativeApprovalTodoRecord): WorkfeedTodoItem {
    return {
      id: `administrative-approval:${record.id}`,
      domain: "oa",
      type: "ADMINISTRATIVE_APPROVAL",
      title: `${record.applicant.displayName}的${record.title}`,
      summary: record.summary,
      priority: "HIGH",
      dueAt: toIsoString(record.submittedAt) ?? null,
      status: record.status,
      targetPath: `/oa/administrative-requests/pending?requestId=${record.id}`,
      targetLabel: "进入行政审批",
      sourceId: record.id,
      createdAt: toIsoString(record.submittedAt)!
    };
  }

  private mapReminderTodo(record: ReminderFeedRecord): WorkfeedTodoItem {
    const isLeadReminder = Boolean(record.lead);
    const targetPath = record.customer
      ? `/scrm/customers?customerId=${record.customer.id}&drawer=follow-up`
      : "/scrm/leads";

    return {
      id: `${isLeadReminder ? "lead" : "customer"}-reminder:${record.id}`,
      domain: "scrm",
      type: isLeadReminder ? "LEAD_REMINDER" : "CUSTOMER_REMINDER",
      title: isLeadReminder ? `跟进线索 ${record.lead?.name ?? ""}` : `跟进客户 ${record.customer?.name ?? ""}`,
      summary: record.followUp?.content ?? "存在待处理的跟进提醒。",
      priority: this.resolvePriority(record.remindAt),
      dueAt: toIsoString(record.remindAt) ?? null,
      status: record.status,
      targetPath,
      targetLabel: isLeadReminder ? "进入线索中心" : "进入客户跟进",
      sourceId: record.id,
      createdAt: toIsoString(record.createdAt)!
    };
  }

  private mapRenewalReminderTodo(record: RenewalReminderFeedRecord): WorkfeedTodoItem {
    return {
      id: `renewal-reminder:${record.id}`,
      domain: "scrm",
      type: "RENEWAL_REMINDER",
      title: `续费跟进 ${record.customer.name}`,
      summary: record.note ?? `${record.contract.title} 即将进入续费窗口。`,
      priority: this.resolvePriority(record.remindAt),
      dueAt: toIsoString(record.remindAt) ?? null,
      status: record.status,
      targetPath: `/scrm/revenue-operations?customerId=${record.customerId}&opportunityId=${record.opportunityId ?? ""}`,
      targetLabel: "进入经营闭环",
      sourceId: record.id,
      createdAt: toIsoString(record.createdAt)!
    };
  }

  private mapLeaveResultNotification(
    record: LeaveResultRecord
  ): Omit<WorkfeedNotificationItem, "isRead" | "readAt"> {
    return {
      id: `leave-result:${record.id}`,
      domain: "oa",
      type: "LEAVE_RESULT",
      title: `请假申请已${this.formatResultStatus(record.status)}`,
      summary: `${record.leaveType}申请已由${record.approver.displayName}处理。`,
      priority: "MEDIUM",
      targetPath: "/oa/approvals/mine",
      targetLabel: "查看我的申请",
      sourceId: record.id,
      occurredAt: toIsoString(record.updatedAt)!
    };
  }

  private mapAdministrativeResultNotification(
    record: AdministrativeApprovalTodoRecord
  ): Omit<WorkfeedNotificationItem, "isRead" | "readAt"> {
    return {
      id: `administrative-result:${record.id}`,
      domain: "oa",
      type: "ADMINISTRATIVE_RESULT",
      title: `${record.title}已${this.formatResultStatus(record.status)}`,
      summary: `${record.title}已由${record.approver.displayName}处理。`,
      priority: "MEDIUM",
      targetPath: `/oa/administrative-requests/mine?requestId=${record.id}`,
      targetLabel: "查看申请详情",
      sourceId: record.id,
      occurredAt: toIsoString(record.updatedAt)!
    };
  }

  private mapReminderNotification(
    record: ReminderFeedRecord
  ): Omit<WorkfeedNotificationItem, "isRead" | "readAt"> {
    const isLeadReminder = Boolean(record.lead);
    const targetPath = record.customer
      ? `/scrm/customers?customerId=${record.customer.id}&drawer=follow-up`
      : "/scrm/leads";

    return {
      id: `${isLeadReminder ? "lead" : "customer"}-notification:${record.id}`,
      domain: "scrm",
      type: isLeadReminder ? "LEAD_REMINDER" : "CUSTOMER_REMINDER",
      title: isLeadReminder ? "线索跟进提醒" : "客户跟进提醒",
      summary: record.followUp?.content ?? "请及时完成跟进。",
      priority: this.resolvePriority(record.remindAt),
      targetPath,
      targetLabel: isLeadReminder ? "进入线索中心" : "进入客户跟进",
      sourceId: record.id,
      occurredAt: toIsoString(record.remindAt)!
    };
  }

  private mapRenewalReminderNotification(
    record: RenewalReminderFeedRecord
  ): Omit<WorkfeedNotificationItem, "isRead" | "readAt"> {
    return {
      id: `renewal-notification:${record.id}`,
      domain: "scrm",
      type: "RENEWAL_REMINDER",
      title: `${record.customer.name}续费提醒`,
      summary: record.note ?? `${record.contract.title} 即将到期。`,
      priority: this.resolvePriority(record.remindAt),
      targetPath: `/scrm/revenue-operations?customerId=${record.customerId}&opportunityId=${record.opportunityId ?? ""}`,
      targetLabel: "进入经营闭环",
      sourceId: record.id,
      occurredAt: toIsoString(record.remindAt)!
    };
  }

  private mapAnnouncementNotification(
    record: AnnouncementFeedRecord
  ): Omit<WorkfeedNotificationItem, "isRead" | "readAt"> {
    return {
      id: `announcement:${record.id}`,
      domain: "oa",
      type: "ANNOUNCEMENT",
      title: record.title,
      summary: record.summary ?? `${record.publishedBy.displayName}发布了新公告。`,
      priority: "LOW",
      targetPath: `/oa/announcements/${record.id}`,
      targetLabel: "查看公告",
      sourceId: record.id,
      occurredAt: toIsoString(record.publishedAt)!
    };
  }

  private mapNotificationCenterNotification(record: NotificationRecordEntity): WorkfeedNotificationItem {
    return {
      id: `notification-center:${record.id}`,
      domain: this.mapNotificationDomain(record.domain),
      type: record.eventType as WorkfeedNotificationType,
      title: record.title,
      summary: record.summary ?? null,
      priority: this.mapNotificationPriority(record.priority),
      targetPath: record.targetPath ?? "/",
      targetLabel: record.targetLabel ?? "查看详情",
      sourceId: record.id,
      occurredAt: toIsoString(record.deliveredAt ?? record.createdAt)!,
      isRead: record.status !== "UNREAD",
      readAt: toIsoString(record.readAt) ?? null
    };
  }

  private mapNotificationDomain(domain: NotificationRecordEntity["domain"]): WorkfeedDomain {
    return domain === "OA" ? "oa" : "scrm";
  }

  private mapNotificationPriority(priority: NotificationRecordEntity["priority"]): WorkfeedPriority {
    if (priority === "CRITICAL" || priority === "HIGH") {
      return "HIGH";
    }

    if (priority === "MEDIUM") {
      return "MEDIUM";
    }

    return "LOW";
  }

  private isSupportedNotificationEventType(eventType: string): eventType is WorkfeedNotificationType {
    return (
      eventType === "LEAVE_RESULT" ||
      eventType === "ADMINISTRATIVE_RESULT" ||
      eventType === "CUSTOMER_REMINDER" ||
      eventType === "LEAD_REMINDER" ||
      eventType === "RENEWAL_REMINDER"
    );
  }

  private resolvePriority(referenceAt: Date): WorkfeedPriority {
    const diff = referenceAt.getTime() - Date.now();

    if (diff <= 1000 * 60 * 60 * 24) {
      return "HIGH";
    }

    if (diff <= 1000 * 60 * 60 * 24 * 3) {
      return "MEDIUM";
    }

    return "LOW";
  }

  private formatResultStatus(status: string) {
    if (status === "APPROVED") {
      return "通过";
    }

    if (status === "REJECTED") {
      return "驳回";
    }

    if (status === "CANCELLED") {
      return "取消";
    }

    return "处理";
  }

  private sortByDueDate(left: WorkfeedTodoItem, right: WorkfeedTodoItem) {
    const leftDue = left.dueAt ? new Date(left.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDue = right.dueAt ? new Date(right.dueAt).getTime() : Number.MAX_SAFE_INTEGER;

    if (leftDue !== rightDue) {
      return leftDue - rightDue;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  }
}
