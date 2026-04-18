import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsDateString, IsOptional, IsString } from "class-validator";

export class CreateOpenApiCredentialDto {
  @ApiProperty({
    description: "凭证名称。"
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "允许的访问范围。",
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  scopes!: string[];

  @ApiPropertyOptional({
    description: "凭证过期时间。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
