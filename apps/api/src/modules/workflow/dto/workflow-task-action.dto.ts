/** workflow 模块 DTO：负责约束节点审批动作的输入契约。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class WorkflowTaskActionDto {
  @ApiPropertyOptional({
    description: "审批意见或处理说明。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
