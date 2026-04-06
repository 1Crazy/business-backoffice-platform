/** dictionaries 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ListDictionariesDto {
  @ApiPropertyOptional({
    description: "字典类型过滤条件。"
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: "是否仅返回启用项。"
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === "true"))
  @IsBoolean()
  enabled?: boolean;
}
