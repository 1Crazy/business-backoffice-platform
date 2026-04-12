import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import {
  NOTIFICATION_TYPES,
  TODO_TYPES,
  WORKFEED_DOMAINS,
  WORKFEED_PRIORITIES
} from "../unified-workfeed.constants";

export class WorkfeedTodoVo {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: WORKFEED_DOMAINS
  })
  domain!: string;

  @ApiProperty({
    enum: TODO_TYPES
  })
  type!: string;

  @ApiProperty()
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

  @ApiProperty()
  status!: string;

  @ApiProperty()
  targetPath!: string;

  @ApiProperty()
  targetLabel!: string;

  @ApiProperty()
  sourceId!: string;

  @ApiProperty()
  createdAt!: string;
}

export class WorkfeedNotificationVo {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: WORKFEED_DOMAINS
  })
  domain!: string;

  @ApiProperty({
    enum: NOTIFICATION_TYPES
  })
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  summary?: string | null;

  @ApiProperty({
    enum: WORKFEED_PRIORITIES
  })
  priority!: string;

  @ApiProperty()
  targetPath!: string;

  @ApiProperty()
  targetLabel!: string;

  @ApiProperty()
  sourceId!: string;

  @ApiProperty()
  occurredAt!: string;

  @ApiProperty()
  isRead!: boolean;

  @ApiPropertyOptional({
    nullable: true
  })
  readAt?: string | null;
}
