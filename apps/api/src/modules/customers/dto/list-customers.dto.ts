/** customers 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

import { PaginationQueryDto } from "@/common/pagination/pagination-query.dto";

export const CUSTOMER_SORT_FIELDS = ["createdAt", "updatedAt", "name", "status"] as const;

export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];

export class ListCustomersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: "关键字，支持匹配客户名称、联系人、手机号和邮箱。"
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: "客户来源。"
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: "客户状态。"
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: "归属人 ID。"
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({
    description: "客户标签 ID。"
  })
  @IsOptional()
  @IsString()
  tagId?: string;
}
