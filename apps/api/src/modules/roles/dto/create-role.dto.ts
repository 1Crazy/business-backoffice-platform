import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

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

  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}
