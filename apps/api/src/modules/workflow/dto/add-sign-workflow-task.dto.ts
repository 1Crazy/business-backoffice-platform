/** workflow 模块 DTO：负责约束节点加签动作的输入契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AddSignWorkflowTaskDto {
  @ApiProperty({
    description: "加签目标用户 ID。"
  })
  @IsString()
  @IsNotEmpty()
  assigneeId!: string;

  @ApiPropertyOptional({
    description: "加签说明。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
