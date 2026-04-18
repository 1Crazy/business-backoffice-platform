/** roles 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { DataScope } from "@prisma/client";
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { RolePolicyBundleDto } from "./role-policy.dto";

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsEnum(DataScope)
  dataScope?: DataScope;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RolePolicyBundleDto)
  policyBundle?: RolePolicyBundleDto;
}
