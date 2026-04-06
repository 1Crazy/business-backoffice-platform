/** sales-opportunities 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OpportunityStage } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateSalesOpportunityStageDto {
  @ApiProperty({
    description: "目标阶段。",
    enum: OpportunityStage
  })
  @IsEnum(OpportunityStage)
  stage!: OpportunityStage;

  @ApiPropertyOptional({
    description: "阶段变更备注。"
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
