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
  @ApiProperty({
    description: "通知渠道治理配置 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "通知渠道类型。",
    enum: NotificationChannel
  })
  channel!: NotificationChannel;

  @ApiProperty({
    description: "通知渠道适配器编码。"
  })
  adapterCode!: string;

  @ApiProperty({
    description: "通知渠道提供方。"
  })
  provider!: string;

  @ApiProperty({
    description: "通知渠道展示名称。"
  })
  displayName!: string;

  @ApiPropertyOptional({
    description: "通知渠道说明。",
    nullable: true
  })
  description?: string | null;

  @ApiProperty({
    description: "通知渠道是否启用。"
  })
  isEnabled!: boolean;

  @ApiProperty({
    description: "通知渠道治理健康状态。",
    enum: GovernanceHealthStatus
  })
  status!: GovernanceHealthStatus;

  @ApiPropertyOptional({
    description: "通知路由适用范围。",
    nullable: true
  })
  routeScope?: string | null;

  @ApiPropertyOptional({
    description: "失败后的回退通知渠道。",
    nullable: true
  })
  fallbackChannel?: string | null;

  @ApiProperty({
    description: "最近失败次数。"
  })
  recentFailures!: number;

  @ApiPropertyOptional({
    description: "通知渠道运行配置。该字段为动态对象，具体键值由渠道适配器实现决定。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  config?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: "通知渠道能力声明。该字段为动态对象，用于标记渠道支持的能力开关与限制。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  capabilities?: Record<string, unknown> | null;

  @ApiProperty({
    description: "通知渠道配置创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "通知渠道配置更新时间。",
    format: "date-time"
  })
  updatedAt!: string;
}

export class StorageConfigVo {
  @ApiProperty({
    description: "存储治理配置 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "存储配置编码。"
  })
  code!: string;

  @ApiProperty({
    description: "存储配置展示名称。"
  })
  displayName!: string;

  @ApiProperty({
    description: "存储提供方类型。",
    enum: AttachmentStorageProvider
  })
  provider!: AttachmentStorageProvider;

  @ApiProperty({
    description: "存储配置是否启用。"
  })
  isEnabled!: boolean;

  @ApiProperty({
    description: "存储配置健康状态。",
    enum: GovernanceHealthStatus
  })
  status!: GovernanceHealthStatus;

  @ApiProperty({
    description: "存储桶名称。"
  })
  bucketName!: string;

  @ApiProperty({
    description: "存储区域名称。"
  })
  regionLabel!: string;

  @ApiProperty({
    description: "是否启用在线预览。"
  })
  previewEnabled!: boolean;

  @ApiPropertyOptional({
    description: "存储扩展配置。该字段为动态对象，具体键值由存储驱动实现决定。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  config?: Record<string, unknown> | null;

  @ApiProperty({
    description: "存储配置创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "存储配置更新时间。",
    format: "date-time"
  })
  updatedAt!: string;
}

export class SchedulerJobVo {
  @ApiProperty({
    description: "调度任务 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "调度任务编码。"
  })
  code!: string;

  @ApiProperty({
    description: "调度任务展示名称。"
  })
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
    description: "调度任务配置创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "调度任务配置更新时间。",
    format: "date-time"
  })
  updatedAt!: string;
}

export class SchedulerJobExecutionVo {
  @ApiProperty({
    description: "调度任务执行记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "所属调度任务 ID。"
  })
  jobId!: string;

  @ApiProperty({
    description: "调度任务执行状态。",
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
    description: "执行开始时间。",
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
    description: "执行记录创建时间。",
    format: "date-time"
  })
  createdAt!: string;
}

export class PersonalDataExportVo {
  @ApiProperty({
    description: "导出的用户个人数据快照。该字段为动态对象，按导出时汇总到的用户资料结构返回。"
  })
  user!: Record<string, unknown>;

  @ApiProperty({
    description: "导出元数据。该字段为动态对象，包含导出范围、时间与统计信息。",
    type: "object",
    additionalProperties: true
  })
  exportMeta!: Record<string, unknown>;
}

export class PersonalDataAnonymizationVo {
  @ApiProperty({
    description: "完成匿名化的用户 ID。"
  })
  userId!: string;

  @ApiProperty({
    description: "匿名化完成时间。",
    format: "date-time"
  })
  anonymizedAt!: string;
}
