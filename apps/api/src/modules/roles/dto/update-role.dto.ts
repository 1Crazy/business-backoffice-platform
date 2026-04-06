/** roles 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { DataScope } from "@prisma/client";
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

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
}
