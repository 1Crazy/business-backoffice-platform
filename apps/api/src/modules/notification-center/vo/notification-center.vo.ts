/** 通知中心 VO：负责声明消息中心和偏好接口的返回结构。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationDigestMode,
  NotificationDomain,
  NotificationPriority,
  NotificationRecordStatus
} from "@prisma/client";

class NotificationDeliveryVo {
  @ApiProperty({
    description: "通知投递记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "投递渠道。",
    enum: NotificationChannel
  })
  channel!: NotificationChannel;

  @ApiPropertyOptional({
    description: "适配器编码。",
    nullable: true
  })
  adapterCode?: string | null;

  @ApiPropertyOptional({
    description: "渠道提供方。",
    nullable: true
  })
  provider?: string | null;

  @ApiProperty({
    description: "投递状态。",
    enum: NotificationDeliveryStatus
  })
  status!: NotificationDeliveryStatus;

  @ApiPropertyOptional({
    description: "外部消息标识。",
    nullable: true
  })
  externalMessageId?: string | null;

  @ApiProperty({
    description: "投递次数。"
  })
  attemptCount!: number;

  @ApiPropertyOptional({
    description: "失败信息。",
    nullable: true
  })
  errorMessage?: string | null;

  @ApiPropertyOptional({
    description: "最近一次尝试时间。",
    format: "date-time",
    nullable: true
  })
  lastAttemptedAt?: string | null;

  @ApiPropertyOptional({
    description: "发送成功时间。",
    format: "date-time",
    nullable: true
  })
  sentAt?: string | null;

  @ApiPropertyOptional({
    description: "发送失败时间。",
    format: "date-time",
    nullable: true
  })
  failedAt?: string | null;
}

export class NotificationRecordVo {
  @ApiProperty({
    description: "通知记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "通知归一化事件 ID，用于关联同一业务事件的多渠道投递。"
  })
  eventId!: string;

  @ApiProperty({
    description: "业务通知域。",
    enum: NotificationDomain
  })
  domain!: NotificationDomain;

  @ApiProperty({
    description: "事件类型。"
  })
  eventType!: string;

  @ApiProperty({
    description: "通知标题。"
  })
  title!: string;

  @ApiPropertyOptional({
    description: "通知摘要。",
    nullable: true
  })
  summary?: string | null;

  @ApiProperty({
    description: "优先级。",
    enum: NotificationPriority
  })
  priority!: NotificationPriority;

  @ApiProperty({
    description: "消息状态。",
    enum: NotificationRecordStatus
  })
  status!: NotificationRecordStatus;

  @ApiPropertyOptional({
    description: "跳转路径。",
    nullable: true
  })
  targetPath?: string | null;

  @ApiPropertyOptional({
    description: "跳转文案。",
    nullable: true
  })
  targetLabel?: string | null;

  @ApiPropertyOptional({
    description: "渠道偏好快照。该字段为动态对象，用于记录通知生成时各渠道偏好判定结果。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  channelPreferences?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: "路由快照。该字段为动态对象，用于记录通知生成时的路由决策上下文。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  routingSnapshot?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: "投递完成时间。",
    format: "date-time",
    nullable: true
  })
  deliveredAt?: string | null;

  @ApiPropertyOptional({
    description: "已读时间。",
    format: "date-time",
    nullable: true
  })
  readAt?: string | null;

  @ApiProperty({
    description: "创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "更新时间。",
    format: "date-time"
  })
  updatedAt!: string;

  @ApiProperty({
    description: "渠道投递结果。",
    type: () => [NotificationDeliveryVo]
  })
  deliveries!: NotificationDeliveryVo[];
}

export class NotificationPreferenceVo {
  @ApiProperty({
    description: "通知偏好配置 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "业务通知域。",
    enum: NotificationDomain
  })
  domain!: NotificationDomain;

  @ApiProperty({
    description: "事件类型。"
  })
  eventType!: string;

  @ApiProperty({
    description: "是否订阅。"
  })
  subscribed!: boolean;

  @ApiProperty({
    description: "站内消息是否启用。"
  })
  inAppEnabled!: boolean;

  @ApiProperty({
    description: "邮件通知是否启用。"
  })
  emailEnabled!: boolean;

  @ApiProperty({
    description: "企业 IM 通知是否启用。"
  })
  enterpriseImEnabled!: boolean;

  @ApiProperty({
    description: "汇总频率。",
    enum: NotificationDigestMode
  })
  digestMode!: NotificationDigestMode;

  @ApiPropertyOptional({
    description: "提醒频率，单位分钟。",
    nullable: true
  })
  reminderFrequencyMinutes?: number | null;

  @ApiPropertyOptional({
    description: "催办阈值，单位分钟。",
    nullable: true
  })
  nudgeThresholdMinutes?: number | null;

  @ApiPropertyOptional({
    description: "静默时段设置。该字段为动态对象，通常按星期和时间段描述免打扰配置。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  quietHours?: Record<string, unknown> | null;

  @ApiProperty({
    description: "创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "更新时间。",
    format: "date-time"
  })
  updatedAt!: string;
}
