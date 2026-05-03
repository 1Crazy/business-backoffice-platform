/** system-governance 模块 repository：负责系统治理域的配置、调度任务和执行记录持久化。 */
import { Injectable } from "@nestjs/common";
import {
  AttachmentStorageProvider,
  BatchTaskStatus,
  GovernanceHealthStatus,
  NotificationChannel,
  PaymentPlanStatus,
  Prisma,
  SchedulerExecutionStatus,
  SchedulerJobStatus
} from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const toOptionalJsonObject = (
  value: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonObject;
};

const notificationChannelConfigSelect = Prisma.validator<Prisma.NotificationChannelConfigSelect>()({
  id: true,
  channel: true,
  adapterCode: true,
  provider: true,
  displayName: true,
  description: true,
  isEnabled: true,
  config: true,
  capabilities: true,
  createdAt: true,
  updatedAt: true
});

const storageConfigSelect = Prisma.validator<Prisma.StorageConfigSelect>()({
  id: true,
  code: true,
  displayName: true,
  provider: true,
  isEnabled: true,
  status: true,
  bucketName: true,
  regionLabel: true,
  previewEnabled: true,
  config: true,
  createdAt: true,
  updatedAt: true
});

const schedulerJobSelect = Prisma.validator<Prisma.SchedulerJobSelect>()({
  id: true,
  code: true,
  displayName: true,
  description: true,
  cronExpression: true,
  status: true,
  ownerName: true,
  nextRunAt: true,
  lastRunAt: true,
  lastExecutionStatus: true,
  lastErrorMessage: true,
  createdAt: true,
  updatedAt: true
});

const schedulerJobExecutionSelect = Prisma.validator<Prisma.SchedulerJobExecutionSelect>()({
  id: true,
  jobId: true,
  status: true,
  summary: true,
  errorMessage: true,
  startedAt: true,
  finishedAt: true,
  durationMs: true,
  createdAt: true
});

export type NotificationChannelConfigRecord = Prisma.NotificationChannelConfigGetPayload<{
  select: typeof notificationChannelConfigSelect;
}>;
export type StorageConfigRecord = Prisma.StorageConfigGetPayload<{
  select: typeof storageConfigSelect;
}>;
export type SchedulerJobRecord = Prisma.SchedulerJobGetPayload<{
  select: typeof schedulerJobSelect;
}>;
export type SchedulerJobExecutionRecord = Prisma.SchedulerJobExecutionGetPayload<{
  select: typeof schedulerJobExecutionSelect;
}>;

type PersonalDataExportRecord = {
  user: {
    id: string;
    tenantId: string;
    username: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    status: string;
    departmentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  customers: Array<{
    id: string;
    name: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
  }>;
  leads: Array<{
    id: string;
    name: string;
    contactName: string | null;
    phone: string | null;
  }>;
  notifications: Array<{
    id: string;
    eventType: string;
    title: string;
    summary: string | null;
    createdAt: Date;
  }>;
  auditLogs: Array<{
    id: string;
    actionType: string;
    targetType: string;
    createdAt: Date;
  }>;
};

@Injectable()
export class SystemGovernanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  ensureNotificationChannelConfigs(
    defaults: Array<{
      channel: NotificationChannel;
      adapterCode: string;
      provider: string;
      displayName: string;
      description?: string | null;
      isEnabled?: boolean;
      config?: Record<string, unknown> | null;
      capabilities?: Record<string, unknown> | null;
    }>
  ) {
    return this.prisma.$transaction(
      defaults.map((item) =>
        this.prisma.notificationChannelConfig.upsert({
          where: {
            adapterCode: item.adapterCode
          },
          update: {},
          create: {
            channel: item.channel,
            adapterCode: item.adapterCode,
            provider: item.provider,
            displayName: item.displayName,
            description: item.description ?? undefined,
            isEnabled: item.isEnabled ?? false,
            config: toOptionalJsonObject(item.config),
            capabilities: toOptionalJsonObject(item.capabilities)
          },
          select: notificationChannelConfigSelect
        })
      )
    );
  }

  listNotificationChannelConfigs(): Promise<NotificationChannelConfigRecord[]> {
    return this.prisma.notificationChannelConfig.findMany({
      select: notificationChannelConfigSelect,
      orderBy: [{ channel: "asc" }, { displayName: "asc" }]
    });
  }

  async countRecentNotificationFailures(
    channels: NotificationChannel[],
    since: Date
  ): Promise<Record<NotificationChannel, number>> {
    if (channels.length === 0) {
      return {
        IN_APP: 0,
        EMAIL: 0,
        ENTERPRISE_IM: 0
      };
    }

    const grouped = await this.prisma.notificationDelivery.groupBy({
      by: ["channel"],
      where: {
        channel: {
          in: channels
        },
        status: "FAILED",
        createdAt: {
          gte: since
        }
      },
      _count: {
        _all: true
      }
    });

    const counts: Record<NotificationChannel, number> = {
      IN_APP: 0,
      EMAIL: 0,
      ENTERPRISE_IM: 0
    };

    for (const item of grouped) {
      counts[item.channel] = item._count._all;
    }

    return counts;
  }

  updateNotificationChannelConfig(
    adapterCode: string,
    data: {
      displayName?: string;
      description?: string | null;
      isEnabled?: boolean;
      config?: Record<string, unknown> | null;
      capabilities?: Record<string, unknown> | null;
    }
  ) {
    return this.prisma.notificationChannelConfig.update({
      where: {
        adapterCode
      },
      data: {
        displayName: data.displayName,
        description: data.description,
        isEnabled: data.isEnabled,
        config: toOptionalJsonObject(data.config),
        capabilities: toOptionalJsonObject(data.capabilities)
      },
      select: notificationChannelConfigSelect
    });
  }

  ensureStorageConfigs(
    defaults: Array<{
      code: string;
      displayName: string;
      provider: AttachmentStorageProvider;
      isEnabled?: boolean;
      status?: GovernanceHealthStatus;
      bucketName: string;
      regionLabel: string;
      previewEnabled?: boolean;
      config?: Record<string, unknown> | null;
    }>
  ) {
    return this.prisma.$transaction(
      defaults.map((item) =>
        this.prisma.storageConfig.upsert({
          where: {
            code: item.code
          },
          update: {},
          create: {
            code: item.code,
            displayName: item.displayName,
            provider: item.provider,
            isEnabled: item.isEnabled ?? true,
            status: item.status ?? GovernanceHealthStatus.HEALTHY,
            bucketName: item.bucketName,
            regionLabel: item.regionLabel,
            previewEnabled: item.previewEnabled ?? true,
            config: toOptionalJsonObject(item.config)
          },
          select: storageConfigSelect
        })
      )
    );
  }

  listStorageConfigs(): Promise<StorageConfigRecord[]> {
    return this.prisma.storageConfig.findMany({
      select: storageConfigSelect,
      orderBy: [{ provider: "asc" }, { displayName: "asc" }]
    });
  }

  findStorageConfigByCode(code: string): Promise<StorageConfigRecord> {
    return this.prisma.storageConfig.findUniqueOrThrow({
      where: {
        code
      },
      select: storageConfigSelect
    });
  }

  findStorageConfigByProvider(provider: AttachmentStorageProvider): Promise<StorageConfigRecord | null> {
    return this.prisma.storageConfig.findFirst({
      where: {
        provider,
        isEnabled: true
      },
      select: storageConfigSelect,
      orderBy: {
        updatedAt: "desc"
      }
    });
  }

  updateStorageConfig(
    code: string,
    data: {
      displayName?: string;
      isEnabled?: boolean;
      status?: GovernanceHealthStatus;
      bucketName?: string;
      regionLabel?: string;
      previewEnabled?: boolean;
      config?: Record<string, unknown> | null;
    }
  ) {
    return this.prisma.storageConfig.update({
      where: {
        code
      },
      data: {
        displayName: data.displayName,
        isEnabled: data.isEnabled,
        status: data.status,
        bucketName: data.bucketName,
        regionLabel: data.regionLabel,
        previewEnabled: data.previewEnabled,
        config: toOptionalJsonObject(data.config)
      },
      select: storageConfigSelect
    });
  }

  ensureSchedulerJobs(
    defaults: Array<{
      code: string;
      displayName: string;
      description?: string | null;
      cronExpression: string;
      status?: SchedulerJobStatus;
      ownerName: string;
      nextRunAt?: Date | null;
    }>
  ) {
    return this.prisma.$transaction(
      defaults.map((item) =>
        this.prisma.schedulerJob.upsert({
          where: {
            code: item.code
          },
          update: {},
          create: {
            code: item.code,
            displayName: item.displayName,
            description: item.description ?? undefined,
            cronExpression: item.cronExpression,
            status: item.status ?? SchedulerJobStatus.RUNNING,
            ownerName: item.ownerName,
            nextRunAt: item.nextRunAt ?? undefined
          },
          select: schedulerJobSelect
        })
      )
    );
  }

  listSchedulerJobs(): Promise<SchedulerJobRecord[]> {
    return this.prisma.schedulerJob.findMany({
      select: schedulerJobSelect,
      orderBy: [{ status: "asc" }, { displayName: "asc" }]
    });
  }

  listDueSchedulerJobs(referenceAt: Date): Promise<SchedulerJobRecord[]> {
    return this.prisma.schedulerJob.findMany({
      where: {
        status: SchedulerJobStatus.RUNNING,
        nextRunAt: {
          lte: referenceAt
        }
      },
      select: schedulerJobSelect,
      orderBy: [{ nextRunAt: "asc" }, { code: "asc" }]
    });
  }

  findSchedulerJobByCode(code: string): Promise<SchedulerJobRecord> {
    return this.prisma.schedulerJob.findUniqueOrThrow({
      where: {
        code
      },
      select: schedulerJobSelect
    });
  }

  updateSchedulerJob(
    code: string,
    data: {
      displayName?: string;
      description?: string | null;
      cronExpression?: string;
      status?: SchedulerJobStatus;
      ownerName?: string;
      nextRunAt?: Date | null;
      lastRunAt?: Date | null;
      lastExecutionStatus?: SchedulerExecutionStatus | null;
      lastErrorMessage?: string | null;
    }
  ) {
    return this.prisma.schedulerJob.update({
      where: {
        code
      },
      data: {
        displayName: data.displayName,
        description: data.description,
        cronExpression: data.cronExpression,
        status: data.status,
        ownerName: data.ownerName,
        nextRunAt: data.nextRunAt,
        lastRunAt: data.lastRunAt,
        lastExecutionStatus: data.lastExecutionStatus,
        lastErrorMessage: data.lastErrorMessage
      },
      select: schedulerJobSelect
    });
  }

  createSchedulerJobExecution(input: {
    jobId: string;
    status?: SchedulerExecutionStatus;
    summary?: string | null;
    errorMessage?: string | null;
    startedAt: Date;
    finishedAt?: Date | null;
    durationMs?: number | null;
  }) {
    return this.prisma.schedulerJobExecution.create({
      data: {
        jobId: input.jobId,
        status: input.status ?? SchedulerExecutionStatus.RUNNING,
        summary: input.summary ?? undefined,
        errorMessage: input.errorMessage ?? undefined,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt ?? undefined,
        durationMs: input.durationMs ?? undefined
      },
      select: schedulerJobExecutionSelect
    });
  }

  updateSchedulerJobExecution(
    id: string,
    data: {
      status?: SchedulerExecutionStatus;
      summary?: string | null;
      errorMessage?: string | null;
      finishedAt?: Date | null;
      durationMs?: number | null;
    }
  ) {
    return this.prisma.schedulerJobExecution.update({
      where: {
        id
      },
      data: {
        status: data.status,
        summary: data.summary,
        errorMessage: data.errorMessage,
        finishedAt: data.finishedAt,
        durationMs: data.durationMs
      },
      select: schedulerJobExecutionSelect
    });
  }

  listSchedulerJobExecutions(code: string): Promise<SchedulerJobExecutionRecord[]> {
    return this.prisma.schedulerJobExecution.findMany({
      where: {
        job: {
          code
        }
      },
      select: schedulerJobExecutionSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });
  }

  countPendingRenewalReminders(referenceAt: Date) {
    return this.prisma.renewalReminder.count({
      where: {
        status: "PENDING",
        remindAt: {
          lte: referenceAt
        }
      }
    });
  }

  countOverduePaymentPlans(referenceAt: Date) {
    return this.prisma.paymentPlan.count({
      where: {
        status: {
          in: [PaymentPlanStatus.PENDING, PaymentPlanStatus.PARTIAL]
        },
        plannedDate: {
          lt: referenceAt
        }
      }
    });
  }

  countArchivableBatchTasks(referenceAt: Date) {
    return this.prisma.batchTask.count({
      where: {
        status: {
          in: [BatchTaskStatus.SUCCEEDED, BatchTaskStatus.FAILED]
        },
        finishedAt: {
          lt: referenceAt
        }
      }
    });
  }

  async purgeRetentionData(input: {
    auditLogsBefore: Date;
    notificationsBefore: Date;
    webhookDeliveriesBefore: Date;
    revokedSessionsBefore: Date;
    batchFailuresBefore: Date;
  }) {
    const [auditLogs, notifications, webhookDeliveries, sessions, batchFailures] = await this.prisma.$transaction([
      this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: input.auditLogsBefore
          }
        }
      }),
      this.prisma.notificationRecord.deleteMany({
        where: {
          createdAt: {
            lt: input.notificationsBefore
          },
          archivedAt: {
            not: null
          }
        }
      }),
      this.prisma.webhookDelivery.deleteMany({
        where: {
          createdAt: {
            lt: input.webhookDeliveriesBefore
          },
          status: {
            in: ["SUCCEEDED", "FAILED"]
          }
        }
      }),
      this.prisma.userSession.deleteMany({
        where: {
          revokedAt: {
            not: null,
            lt: input.revokedSessionsBefore
          }
        }
      }),
      this.prisma.batchTaskFailure.deleteMany({
        where: {
          createdAt: {
            lt: input.batchFailuresBefore
          }
        }
      })
    ]);

    return {
      auditLogsDeleted: auditLogs.count,
      notificationsDeleted: notifications.count,
      webhookDeliveriesDeleted: webhookDeliveries.count,
      revokedSessionsDeleted: sessions.count,
      batchTaskFailuresDeleted: batchFailures.count
    };
  }

  async exportPersonalData(userId: string): Promise<PersonalDataExportRecord> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId
      },
      select: {
        id: true,
        tenantId: true,
        username: true,
        displayName: true,
        email: true,
        phone: true,
        status: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    const [customers, leads, notifications, auditLogs] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where: {
          ownerId: userId
        },
        select: {
          id: true,
          name: true,
          contactName: true,
          phone: true,
          email: true
        }
      }),
      this.prisma.lead.findMany({
        where: {
          ownerId: userId
        },
        select: {
          id: true,
          name: true,
          contactName: true,
          phone: true
        }
      }),
      this.prisma.notificationRecord.findMany({
        where: {
          recipientId: userId
        },
        select: {
          id: true,
          eventType: true,
          title: true,
          summary: true,
          createdAt: true
        },
        take: 200
      }),
      this.prisma.auditLog.findMany({
        where: {
          actorId: userId
        },
        select: {
          id: true,
          actionType: true,
          targetType: true,
          createdAt: true
        },
        take: 200
      })
    ]);

    return {
      user,
      customers,
      leads,
      notifications,
      auditLogs
    };
  }

  async anonymizeUser(userId: string, actorId: string) {
    const now = new Date();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId
      },
      select: {
        id: true,
        tenantId: true,
        username: true
      }
    });
    const token = user.id.slice(0, 8);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: userId
        },
        data: {
          displayName: `匿名用户-${token}`,
          email: null,
          phone: null
        }
      }),
      this.prisma.customer.updateMany({
        where: {
          ownerId: userId
        },
        data: {
          contactName: null,
          phone: null,
          email: null,
          notes: `personal-data-anonymized:${now.toISOString()}`
        }
      }),
      this.prisma.lead.updateMany({
        where: {
          ownerId: userId
        },
        data: {
          contactName: null,
          phone: null,
          notes: `personal-data-anonymized:${now.toISOString()}`
        }
      }),
      this.prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          actorId,
          actionType: "UPDATE",
          targetType: "personal-data-anonymization",
          targetId: userId,
          detail: {
            anonymizedAt: now.toISOString()
          }
        }
      })
    ]);

    return {
      userId,
      anonymizedAt: now
    };
  }
}
