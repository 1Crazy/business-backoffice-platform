/** workflow 模块 DTO：负责约束流程抄送接口的输入契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class CreateWorkflowCcDto {
  @ApiProperty({
    description: "抄送用户 ID 列表。",
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  userIds!: string[];

  @ApiPropertyOptional({
    description: "抄送说明。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
