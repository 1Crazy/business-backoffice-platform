/** roles 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DataScope } from "@prisma/client";
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { RolePolicyBundleDto } from "./role-policy.dto";

export class CreateRoleDto {
  @ApiProperty({
    description: "角色名称。"
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "角色编码。"
  })
  @IsString()
  code!: string;

  @ApiPropertyOptional({
    description: "角色说明。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description: "是否为系统内置角色。"
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({
    description: "数据范围。",
    enum: DataScope
  })
  @IsOptional()
  @IsEnum(DataScope)
  dataScope?: DataScope;

  @ApiProperty({
    description: "角色绑定的权限 ID 列表。",
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];

  @ApiPropertyOptional({
    description: "细粒度策略组合。",
    type: () => RolePolicyBundleDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RolePolicyBundleDto)
  policyBundle?: RolePolicyBundleDto;
}
