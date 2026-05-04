import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import {
  NOTIFICATION_TYPES,
  TODO_TYPES,
  WORKFEED_DOMAINS,
  WORKFEED_PRIORITIES
} from "../unified-workfeed.constants";

export class WorkfeedTodoVo {
  @ApiProperty({
    description: "工作台待办 ID。"
  })
  id!: string;

  @ApiProperty({
    enum: WORKFEED_DOMAINS
  })
  domain!: string;

  @ApiProperty({
    enum: TODO_TYPES
  })
  type!: string;

  @ApiProperty({
    description: "待办标题。"
  })
  title!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  summary?: string | null;

  @ApiProperty({
    enum: WORKFEED_PRIORITIES
  })
  priority!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  dueAt?: string | null;

  @ApiProperty({
    description: "待办状态。"
  })
  status!: string;

  @ApiProperty({
    description: "待办跳转路径。"
  })
  targetPath!: string;

  @ApiProperty({
    description: "待办跳转文案。"
  })
  targetLabel!: string;

  @ApiProperty({
    description: "待办关联源单 ID。"
  })
  sourceId!: string;

  @ApiProperty({
    description: "待办创建时间。"
  })
  createdAt!: string;
}

export class WorkfeedNotificationVo {
  @ApiProperty({
    description: "工作台通知 ID。"
  })
  id!: string;

  @ApiProperty({
    enum: WORKFEED_DOMAINS
  })
  domain!: string;

  @ApiProperty({
    enum: NOTIFICATION_TYPES
  })
  type!: string;

  @ApiProperty({
    description: "通知标题。"
  })
  title!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  summary?: string | null;

  @ApiProperty({
    enum: WORKFEED_PRIORITIES
  })
  priority!: string;

  @ApiProperty({
    description: "通知跳转路径。"
  })
  targetPath!: string;

  @ApiProperty({
    description: "通知跳转文案。"
  })
  targetLabel!: string;

  @ApiProperty({
    description: "通知关联源单 ID。"
  })
  sourceId!: string;

  @ApiProperty({
    description: "通知发生时间。"
  })
  occurredAt!: string;

  @ApiProperty({
    description: "当前通知是否已读。"
  })
  isRead!: boolean;

  @ApiPropertyOptional({
    nullable: true
  })
  readAt?: string | null;
}
