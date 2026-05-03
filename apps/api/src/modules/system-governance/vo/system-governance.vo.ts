/** system-governance 模块 VO：负责系统治理接口的 Swagger 契约定义。 */
import {
  AttachmentStorageProvider,
  GovernanceHealthStatus,
  NotificationChannel,
  SchedulerExecutionStatus,
  SchedulerJobStatus
} from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class NotificationChannelConfigVo {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: NotificationChannel
  })
  channel!: NotificationChannel;

  @ApiProperty()
  adapterCode!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  description?: string | null;

  @ApiProperty()
  isEnabled!: boolean;

  @ApiProperty({
    enum: GovernanceHealthStatus
  })
  status!: GovernanceHealthStatus;

  @ApiPropertyOptional({
    nullable: true
  })
  routeScope?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  fallbackChannel?: string | null;

  @ApiProperty()
  recentFailures!: number;

  @ApiPropertyOptional({
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  config?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  capabilities?: Record<string, unknown> | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class StorageConfigVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({
    enum: AttachmentStorageProvider
  })
  provider!: AttachmentStorageProvider;

  @ApiProperty()
  isEnabled!: boolean;

  @ApiProperty({
    enum: GovernanceHealthStatus
  })
  status!: GovernanceHealthStatus;

  @ApiProperty()
  bucketName!: string;

  @ApiProperty()
  regionLabel!: string;

  @ApiProperty()
  previewEnabled!: boolean;

  @ApiPropertyOptional({
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  config?: Record<string, unknown> | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class SchedulerJobVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  description?: string | null;

  @ApiProperty()
  cronExpression!: string;

  @ApiProperty({
    enum: SchedulerJobStatus
  })
  status!: SchedulerJobStatus;

  @ApiProperty()
  ownerName!: string;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  nextRunAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  lastRunAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    enum: SchedulerExecutionStatus
  })
  lastExecutionStatus?: SchedulerExecutionStatus | null;

  @ApiPropertyOptional({
    nullable: true
  })
  lastErrorMessage?: string | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class SchedulerJobExecutionVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  jobId!: string;

  @ApiProperty({
    enum: SchedulerExecutionStatus
  })
  status!: SchedulerExecutionStatus;

  @ApiPropertyOptional({
    nullable: true
  })
  summary?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  errorMessage?: string | null;

  @ApiProperty({
    format: "date-time"
  })
  startedAt!: string;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  finishedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  durationMs?: number | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;
}

export class PersonalDataExportVo {
  @ApiProperty()
  user!: Record<string, unknown>;

  @ApiProperty({
    type: "object",
    additionalProperties: true
  })
  exportMeta!: Record<string, unknown>;
}

export class PersonalDataAnonymizationVo {
  @ApiProperty()
  userId!: string;

  @ApiProperty({
    format: "date-time"
  })
  anonymizedAt!: string;
}
