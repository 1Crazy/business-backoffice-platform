/** 分页基础设施：负责统一分页入参、排序规则和分页响应契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { SORT_ORDERS, type SortOrder } from "./pagination-query.dto";

export class PaginatedResponseDto {
  @ApiProperty({
    description: "当前页码。",
    example: 1
  })
  page!: number;

  @ApiProperty({
    description: "当前每页条数。",
    example: 20
  })
  pageSize!: number;

  @ApiProperty({
    description: "符合条件的总记录数。",
    example: 128
  })
  total!: number;

  @ApiProperty({
    description: "总页数。",
    example: 7
  })
  totalPages!: number;

  @ApiPropertyOptional({
    description: "实际生效的排序字段。",
    example: "createdAt"
  })
  sortBy?: string;

  @ApiProperty({
    description: "实际生效的排序方向。",
    enum: SORT_ORDERS,
    example: "desc"
  })
  sortOrder!: SortOrder;
}
