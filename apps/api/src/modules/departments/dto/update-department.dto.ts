/** departments 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { IsOptional, IsString } from "class-validator";

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;
}
