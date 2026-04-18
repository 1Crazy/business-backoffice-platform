/** roles 模块 DTO：负责描述细粒度策略组合的输入结构。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

export class ExtendedDataScopeRuleDto {
  @ApiProperty({
    description: "扩展数据范围维度。",
    enum: ["TEAM", "REGION", "CUSTOMER_POOL", "CUSTOM"]
  })
  @IsString()
  @IsIn(["TEAM", "REGION", "CUSTOMER_POOL", "CUSTOM"])
  dimension!: "TEAM" | "REGION" | "CUSTOMER_POOL" | "CUSTOM";

  @ApiProperty({
    description: "维度说明。",
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  values!: string[];

  @ApiPropertyOptional({
    description: "规则备注。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  note?: string | null;
}

export class FieldPermissionRuleDto {
  @ApiProperty({
    description: "业务资源编码，例如 customer 或 payment-plan。"
  })
  @IsString()
  @IsNotEmpty()
  resource!: string;

  @ApiProperty({
    description: "字段编码。"
  })
  @IsString()
  @IsNotEmpty()
  field!: string;

  @ApiProperty({
    description: "字段控制级别。",
    enum: ["READ_WRITE", "READONLY", "MASKED", "HIDDEN"]
  })
  @IsString()
  @IsIn(["READ_WRITE", "READONLY", "MASKED", "HIDDEN"])
  visibility!: "READ_WRITE" | "READONLY" | "MASKED" | "HIDDEN";
}

export class ActionPermissionRuleDto {
  @ApiProperty({
    description: "业务资源编码，例如 approval 或 revenue。"
  })
  @IsString()
  @IsNotEmpty()
  resource!: string;

  @ApiProperty({
    description: "动作编码，例如 export、approve 或 confirm-payment。"
  })
  @IsString()
  @IsNotEmpty()
  action!: string;

  @ApiProperty({
    description: "当前动作是否允许。"
  })
  @IsBoolean()
  allowed!: boolean;
}

export class RolePolicyBundleDto {
  @ApiPropertyOptional({
    description: "扩展数据范围策略。",
    type: () => [ExtendedDataScopeRuleDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtendedDataScopeRuleDto)
  extendedDataScopes?: ExtendedDataScopeRuleDto[];

  @ApiPropertyOptional({
    description: "字段级可见 / 可编辑规则。",
    type: () => [FieldPermissionRuleDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldPermissionRuleDto)
  fieldPermissionRules?: FieldPermissionRuleDto[];

  @ApiPropertyOptional({
    description: "动作级授权规则。",
    type: () => [ActionPermissionRuleDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionPermissionRuleDto)
  actionPermissionRules?: ActionPermissionRuleDto[];
}
