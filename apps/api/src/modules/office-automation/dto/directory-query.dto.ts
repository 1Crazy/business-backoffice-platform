/** OA DTO：负责约束通讯录筛选查询参数。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class DirectoryQueryDto {
  @ApiPropertyOptional({
    description: "部门 ID；为空时查询全部部门成员。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  departmentId?: string;
}
