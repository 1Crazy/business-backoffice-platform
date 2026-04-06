/** sales-opportunities 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class MarkSalesOpportunityWonDto {
  @ApiPropertyOptional({
    description: "赢单收口备注。"
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
