/** customers 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateCustomerTagDto {
  @ApiProperty({
    description: "标签名称。"
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: "标签颜色值。"
  })
  @IsOptional()
  @IsString()
  color?: string;
}
