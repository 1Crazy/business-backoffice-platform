/** system-governance 模块 DTO：负责通知渠道治理更新入参约束。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator";

export class UpdateNotificationChannelConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    nullable: true
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: "通知渠道运行配置。该字段为动态对象，具体键值由渠道适配器实现决定。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: "通知渠道能力声明。该字段为动态对象，用于提交能力开关与扩展约束。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  @IsOptional()
  @IsObject()
  capabilities?: Record<string, unknown> | null;
}
