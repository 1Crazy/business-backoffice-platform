/** users 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    description: "登录用户名。"
  })
  @IsString()
  username!: string;

  @ApiProperty({
    description: "显示名称。"
  })
  @IsString()
  displayName!: string;

  @ApiProperty({
    description: "登录密码，最少 12 位且包含大小写字母、数字和符号。"
  })
  @IsString()
  @MinLength(12)
  password!: string;

  @ApiPropertyOptional({
    description: "电子邮箱。",
    nullable: true
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    description: "联系电话。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({
    description: "员工所属部门 ID。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  departmentId?: string | null;

  @ApiProperty({
    description: "角色 ID 列表。",
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  roleIds!: string[];
}
