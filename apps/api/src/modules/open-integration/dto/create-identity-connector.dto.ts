import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IdentityConnectorMatchField, IdentityConnectorType, RecordStatus } from "@prisma/client";
import { IsArray, IsEnum, IsObject, IsOptional, IsString } from "class-validator";

export class CreateIdentityConnectorDto {
  @ApiProperty({
    description: "连接器名称。"
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "连接器类型。",
    enum: IdentityConnectorType
  })
  @IsEnum(IdentityConnectorType)
  type!: IdentityConnectorType;

  @ApiPropertyOptional({
    description: "连接器状态。",
    enum: RecordStatus
  })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @ApiPropertyOptional({
    description: "外部身份与本系统员工账号的匹配字段。",
    enum: IdentityConnectorMatchField
  })
  @IsOptional()
  @IsEnum(IdentityConnectorMatchField)
  matchField?: IdentityConnectorMatchField;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issuerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorizeUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tokenUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  directoryUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({
    description: "客户端密钥，仅创建或更新时传入。"
  })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional({
    description: "允许的邮箱域名白名单。",
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @ApiPropertyOptional({
    description: "扩展配置。该字段为动态对象，具体键值由连接器类型与接入协议决定。",
    type: "object",
    additionalProperties: true
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
