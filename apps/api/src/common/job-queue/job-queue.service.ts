/** 后台任务队列 service：提供轻量 PostgreSQL-backed 入队与 worker 轮询执行能力。 */
import { Injectable, Logger } from "@nestjs/common";

import { JobQueueRepository, type BackgroundJobRecord } from "./repositories/job-queue.repository";

export type BackgroundJobHandler = (job: BackgroundJobRecord) => Promise<Record<string, unknown> | void>;

@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);
  private readonly handlers = new Map<string, BackgroundJobHandler>();

  constructor(private readonly jobQueueRepository: JobQueueRepository) {}

  registerHandler(type: string, handler: BackgroundJobHandler): void {
    this.handlers.set(type, handler);
  }

  enqueue(input: {
    type: string;
    payload: Record<string, unknown>;
    maxAttempts?: number;
    availableAt?: Date;
    correlationId?: string | null;
  }) {
    return this.jobQueueRepository.enqueue(input);
  }

  async runDueJobs(types?: string[], limit = 10): Promise<BackgroundJobRecord[]> {
    const runnableTypes = types?.length ? types : Array.from(this.handlers.keys());
    const processed: BackgroundJobRecord[] = [];

    for (let index = 0; index < limit; index += 1) {
      const job = await this.jobQueueRepository.claimNext(runnableTypes);

      if (!job) {
        break;
      }

      processed.push(await this.runClaimedJob(job));
    }

    return processed;
  }

  scheduleRun(types?: string[]): void {
    queueMicrotask(() => {
      void this.runDueJobs(types).catch((error) => {
        const message = error instanceof Error ? error.message : "Background job run failed.";
        this.logger.error(message);
      });
    });
  }

  private async runClaimedJob(job: BackgroundJobRecord): Promise<BackgroundJobRecord> {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      return this.jobQueueRepository.fail(job, `No background job handler registered for ${job.type}.`);
    }

    try {
      const result = await handler(job);
      return this.jobQueueRepository.complete(job.id, result ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Background job failed.";
      return this.jobQueueRepository.fail(job, message);
    }
  }
}
