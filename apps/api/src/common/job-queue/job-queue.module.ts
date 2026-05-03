/** 后台任务队列模块：以 PostgreSQL 表作为默认 worker 队列存储。 */
import { Global, Module } from "@nestjs/common";

import { JobQueueRepository } from "./repositories/job-queue.repository";
import { JobQueueService } from "./job-queue.service";

@Global()
@Module({
  providers: [JobQueueRepository, JobQueueService],
  exports: [JobQueueService]
})
export class JobQueueModule {}
