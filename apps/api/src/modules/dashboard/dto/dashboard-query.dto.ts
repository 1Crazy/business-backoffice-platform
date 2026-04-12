/** dashboard 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class DashboardQueryDto {
  @ApiPropertyOptional({
    description: "统计开始时间。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "统计结束时间。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: "按团队筛选时使用的部门 ID。"
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    description: "按负责人筛选时使用的用户 ID。"
  })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
