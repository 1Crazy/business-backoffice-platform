/** system-governance 模块 DTO：负责存储治理更新入参约束。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { GovernanceHealthStatus } from "@prisma/client";
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from "class-validator";

export class UpdateStorageConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    enum: GovernanceHealthStatus
  })
  @IsOptional()
  @IsEnum(GovernanceHealthStatus)
  status?: GovernanceHealthStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bucketName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  regionLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  previewEnabled?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;
}
