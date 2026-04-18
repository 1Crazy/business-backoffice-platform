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
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  @IsOptional()
  @IsObject()
  capabilities?: Record<string, unknown> | null;
}
