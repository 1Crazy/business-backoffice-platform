import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";

export class UpsertTenantConfigOverrideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "租户覆盖配置值。该字段为动态对象，不同配置项允许提交不同键值结构。",
    type: "object",
    additionalProperties: true
  })
  @IsObject()
  value!: Record<string, unknown>;
}
