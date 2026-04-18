/** workflow 模块 DTO：负责约束流程实例关闭类动作的输入契约。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateWorkflowInstanceDto {
  @ApiPropertyOptional({
    description: "动作说明。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
