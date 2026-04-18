/** 通知中心 DTO：负责约束通知偏好批量保存接口的输入契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";

import {
  NOTIFICATION_DIGEST_MODES,
  NOTIFICATION_DOMAINS,
  type NotificationDigestModeValue,
  type NotificationDomainValue
} from "../notification-center.constants";

export class UpsertNotificationPreferenceItemDto {
  @ApiProperty({
    enum: NOTIFICATION_DOMAINS,
    description: "业务通知域。"
  })
  @IsEnum(NOTIFICATION_DOMAINS)
  domain!: NotificationDomainValue;

  @ApiProperty({
    description: "事件类型。"
  })
  @IsString()
  eventType!: string;

  @ApiPropertyOptional({
    description: "是否订阅该类消息。",
    default: true
  })
  @IsOptional()
  @IsBoolean()
  subscribed?: boolean;

  @ApiPropertyOptional({
    description: "是否启用邮件通知。",
    default: false
  })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({
    description: "是否启用企业 IM 通知。",
    default: false
  })
  @IsOptional()
  @IsBoolean()
  enterpriseImEnabled?: boolean;

  @ApiPropertyOptional({
    description: "汇总频率。",
    enum: NOTIFICATION_DIGEST_MODES,
    default: "IMMEDIATE"
  })
  @IsOptional()
  @IsEnum(NOTIFICATION_DIGEST_MODES)
  digestMode?: NotificationDigestModeValue;

  @ApiPropertyOptional({
    description: "提醒频率，单位分钟。",
    nullable: true
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reminderFrequencyMinutes?: number | null;

  @ApiPropertyOptional({
    description: "催办阈值，单位分钟。",
    nullable: true
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nudgeThresholdMinutes?: number | null;

  @ApiPropertyOptional({
    description: "静默时段设置。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  @IsOptional()
  quietHours?: Record<string, unknown> | null;
}

export class UpsertNotificationPreferencesDto {
  @ApiProperty({
    description: "待保存的偏好项。",
    type: () => [UpsertNotificationPreferenceItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertNotificationPreferenceItemDto)
  preferences!: UpsertNotificationPreferenceItemDto[];
}
