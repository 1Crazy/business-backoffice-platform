/** customers 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateCustomerFollowUpDto {
  @ApiProperty({
    description: "跟进内容。"
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    description: "下次跟进时间，使用 ISO 8601 日期时间格式。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;
}
