/** departments 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateDepartmentDto {
  @ApiProperty({
    description: "部门名称。"
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "部门编码。"
  })
  @IsString()
  code!: string;

  @ApiPropertyOptional({
    description: "上级部门 ID；为空时表示顶级部门。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  parentId?: string | null;
}
