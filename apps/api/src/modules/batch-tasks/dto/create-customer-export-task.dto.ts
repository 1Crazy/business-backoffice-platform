/** 批任务 DTO：负责约束客户导出任务的筛选参数。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateCustomerExportTaskDto {
  @ApiPropertyOptional({
    description: "关键字，匹配客户名称、联系人、手机号和邮箱。"
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: "客户状态。"
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: "客户负责人员工 ID。"
  })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
