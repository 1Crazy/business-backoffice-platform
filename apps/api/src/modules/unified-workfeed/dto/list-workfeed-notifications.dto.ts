import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";

import {
  NOTIFICATION_TYPES,
  WORKFEED_DOMAINS,
  type WorkfeedDomain,
  type WorkfeedNotificationType
} from "../unified-workfeed.constants";

export class ListWorkfeedNotificationsDto {
  @ApiPropertyOptional({
    enum: WORKFEED_DOMAINS,
    description: "按业务域筛选通知。"
  })
  @IsOptional()
  @IsEnum(WORKFEED_DOMAINS)
  domain?: WorkfeedDomain;

  @ApiPropertyOptional({
    enum: NOTIFICATION_TYPES,
    description: "按通知类型筛选。"
  })
  @IsOptional()
  @IsEnum(NOTIFICATION_TYPES)
  type?: WorkfeedNotificationType;

  @ApiPropertyOptional({
    description: "是否仅返回未读通知。"
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  unreadOnly?: boolean;
}
