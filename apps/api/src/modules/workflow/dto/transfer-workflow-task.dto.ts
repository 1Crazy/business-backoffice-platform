/** workflow 模块 DTO：负责约束节点转交动作的输入契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class TransferWorkflowTaskDto {
  @ApiProperty({
    description: "新的审批处理人员工 ID。"
  })
  @IsString()
  @IsNotEmpty()
  assigneeId!: string;

  @ApiPropertyOptional({
    description: "转交说明。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
