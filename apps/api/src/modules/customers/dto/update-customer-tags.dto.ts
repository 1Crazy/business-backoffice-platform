/** customers 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class UpdateCustomerTagsDto {
  @ApiProperty({
    description: "新的标签 ID 列表。",
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  tagIds!: string[];
}
