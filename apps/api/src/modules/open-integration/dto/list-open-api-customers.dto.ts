import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

import { PaginationQueryDto } from "@/common/pagination/pagination-query.dto";

export class ListOpenApiCustomersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: "按名称、联系人、邮箱或手机号模糊查询。"
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}
