/** sales-opportunities 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class MarkSalesOpportunityLostDto {
  @ApiProperty({
    description: "输单原因。"
  })
  @IsString()
  lostReason!: string;

  @ApiPropertyOptional({
    description: "输单补充备注。"
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
