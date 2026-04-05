import { DataScope } from "@prisma/client";
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class CreateRoleDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsEnum(DataScope)
  dataScope?: DataScope;

  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}
