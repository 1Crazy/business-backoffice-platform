/** 通知中心 DTO：负责约束站内消息列表查询的筛选参数。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

import { NOTIFICATION_DOMAINS, type NotificationDomainValue } from "../notification-center.constants";

export class ListNotificationRecordsDto {
  @ApiPropertyOptional({
    enum: NOTIFICATION_DOMAINS,
    description: "按通知域筛选消息。"
  })
  @IsOptional()
  @IsEnum(NOTIFICATION_DOMAINS)
  domain?: NotificationDomainValue;

  @ApiPropertyOptional({
    description: "按事件类型筛选消息。"
  })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({
    description: "是否仅查询未读消息。"
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  unreadOnly?: boolean;
}
