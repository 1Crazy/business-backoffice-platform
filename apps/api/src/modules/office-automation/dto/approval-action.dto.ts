/** OA DTO：负责约束审批动作提交接口的输入契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ApprovalActionDecision } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ApprovalActionDto {
  @ApiProperty({
    description: "审批结果。",
    enum: ApprovalActionDecision
  })
  @IsEnum(ApprovalActionDecision)
  decision!: ApprovalActionDecision;

  @ApiPropertyOptional({
    description: "审批意见。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  comment?: string;
}
