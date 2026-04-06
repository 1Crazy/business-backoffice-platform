/** sales-opportunities 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OpportunityStage } from "@prisma/client";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateSalesOpportunityDto {
  @ApiProperty({
    description: "商机名称。"
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "关联客户 ID。"
  })
  @IsString()
  customerId!: string;

  @ApiPropertyOptional({
    description: "来源线索 ID。"
  })
  @IsOptional()
  @IsString()
  sourceLeadId?: string | null;

  @ApiPropertyOptional({
    description: "负责人 ID；不传时默认归当前操作人。"
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({
    description: "初始阶段；不传时默认进入 DISCOVERY。",
    enum: OpportunityStage
  })
  @IsOptional()
  @IsEnum(OpportunityStage)
  stage?: OpportunityStage;

  @ApiProperty({
    description: "预计金额。"
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  expectedAmount!: number;

  @ApiProperty({
    description: "预计成交日期。",
    format: "date-time"
  })
  @IsDateString()
  expectedCloseDate!: string;

  @ApiProperty({
    description: "下一步动作。"
  })
  @IsString()
  nextAction!: string;

  @ApiPropertyOptional({
    description: "补充说明。"
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
