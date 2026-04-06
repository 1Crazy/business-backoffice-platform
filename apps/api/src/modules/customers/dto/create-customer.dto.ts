/** customers 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateCustomerDto {
  @ApiProperty({
    description: "客户名称。"
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: "联系人姓名。"
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    description: "联系电话。"
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: "电子邮箱。"
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "客户来源。"
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: "客户状态。"
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: "客户备注。"
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: "负责人 ID；不传时默认归当前操作人。"
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({
    description: "客户标签 ID 列表。",
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
