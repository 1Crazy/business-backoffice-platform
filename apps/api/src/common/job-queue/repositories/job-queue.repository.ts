/** 后台任务队列 repository：封装 PostgreSQL-backed job 的入队、领取与状态更新。 */
import { Injectable } from "@nestjs/common";
import { BackgroundJobStatus, Prisma } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const backgroundJobSelect = Prisma.validator<Prisma.BackgroundJobSelect>()({
  id: true,
  type: true,
  status: true,
  payload: true,
  result: true,
  errorMessage: true,
  attempts: true,
  maxAttempts: true,
  availableAt: true,
  lockedAt: true,
  startedAt: true,
  finishedAt: true,
  correlationId: true,
  createdAt: true,
  updatedAt: true
});

export type BackgroundJobRecord = Prisma.BackgroundJobGetPayload<{ select: typeof backgroundJobSelect }>;

@Injectable()
export class JobQueueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  enqueue(input: {
    type: string;
    payload: Record<string, unknown>;
    maxAttempts?: number;
    availableAt?: Date;
    correlationId?: string | null;
  }): Promise<BackgroundJobRecord> {
    return this.prisma.backgroundJob.create({
      data: {
        type: input.type,
        payload: input.payload as Prisma.InputJsonObject,
        maxAttempts: input.maxAttempts ?? 3,
        availableAt: input.availableAt,
        correlationId: input.correlationId ?? undefined
      },
      select: backgroundJobSelect
    });
  }

  async claimNext(types: string[], now = new Date()): Promise<BackgroundJobRecord | null> {
    const candidates = await this.prisma.backgroundJob.findMany({
      where: {
        type: {
          in: types
        },
        status: BackgroundJobStatus.PENDING,
        availableAt: {
          lte: now
        }
      },
      select: {
        id: true
      },
      orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
      take: 1
    });
    const candidate = candidates[0];

    if (!candidate) {
      return null;
    }

    const updated = await this.prisma.backgroundJob.updateMany({
      where: {
        id: candidate.id,
        status: BackgroundJobStatus.PENDING
      },
      data: {
        status: BackgroundJobStatus.RUNNING,
        attempts: {
          increment: 1
        },
        lockedAt: now,
        startedAt: now
      }
    });

    if (updated.count === 0) {
      return null;
    }

    return this.findById(candidate.id);
  }

  complete(jobId: string, result?: Record<string, unknown> | null): Promise<BackgroundJobRecord> {
    return this.prisma.backgroundJob.update({
      where: {
        id: jobId
      },
      data: {
        status: BackgroundJobStatus.SUCCEEDED,
        result: result ? (result as Prisma.InputJsonObject) : undefined,
        errorMessage: null,
        finishedAt: new Date()
      },
      select: backgroundJobSelect
    });
  }

  fail(job: BackgroundJobRecord, errorMessage: string, nextAvailableAt?: Date): Promise<BackgroundJobRecord> {
    const canRetry = job.attempts < job.maxAttempts;

    return this.prisma.backgroundJob.update({
      where: {
        id: job.id
      },
      data: {
        status: canRetry ? BackgroundJobStatus.PENDING : BackgroundJobStatus.FAILED,
        errorMessage,
        lockedAt: null,
        availableAt: canRetry ? nextAvailableAt ?? new Date(Date.now() + 60_000) : job.availableAt,
        finishedAt: canRetry ? null : new Date()
      },
      select: backgroundJobSelect
    });
  }

  findById(jobId: string): Promise<BackgroundJobRecord> {
    return this.prisma.backgroundJob.findUniqueOrThrow({
      where: {
        id: jobId
      },
      select: backgroundJobSelect
    });
  }
}
