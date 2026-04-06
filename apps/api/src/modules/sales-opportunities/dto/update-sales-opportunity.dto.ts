/** sales-opportunities 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateSalesOpportunityDto {
  @ApiPropertyOptional({
    description: "商机名称。"
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "来源线索 ID；传 null 可清空。"
  })
  @IsOptional()
  @IsString()
  sourceLeadId?: string | null;

  @ApiPropertyOptional({
    description: "负责人 ID。"
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({
    description: "预计金额。"
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  expectedAmount?: number;

  @ApiPropertyOptional({
    description: "预计成交日期。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional({
    description: "下一步动作。"
  })
  @IsOptional()
  @IsString()
  nextAction?: string;

  @ApiPropertyOptional({
    description: "补充说明；传 null 可清空。"
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
