/** workflow 模块 DTO：负责约束流程实例发起接口的输入契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class StartWorkflowInstanceDto {
  @ApiProperty({
    description: "流程标题。"
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: "业务主键，用于关联外部业务对象。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  businessKey?: string | null;

  @ApiProperty({
    description: "流程表单数据。"
  })
  @IsObject()
  formData!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "发起时额外抄送的用户 ID 列表。",
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccUserIds?: string[];
}
