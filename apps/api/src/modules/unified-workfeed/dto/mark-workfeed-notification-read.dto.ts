import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";

import { NOTIFICATION_TYPES, type WorkfeedNotificationType } from "../unified-workfeed.constants";

export class MarkWorkfeedNotificationReadDto {
  @ApiProperty({
    enum: NOTIFICATION_TYPES,
    description: "通知类型。"
  })
  @IsEnum(NOTIFICATION_TYPES)
  notificationType!: WorkfeedNotificationType;

  @ApiProperty({
    description: "待标记已读的通知源单 ID。"
  })
  @IsString()
  sourceId!: string;
}
