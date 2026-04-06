/** dictionaries 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class CreateDictionaryEntryDto {
  @ApiProperty({
    description: "字典类型。"
  })
  @IsString()
  type!: string;

  @ApiProperty({
    description: "字典显示标签。"
  })
  @IsString()
  label!: string;

  @ApiProperty({
    description: "字典值。"
  })
  @IsString()
  value!: string;

  @ApiPropertyOptional({
    description: "排序值。"
  })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({
    description: "是否启用。"
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
