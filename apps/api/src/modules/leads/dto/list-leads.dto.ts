/** leads 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { LeadStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

import { PaginationQueryDto } from "@/common/pagination/pagination-query.dto";

export const LEAD_SORT_FIELDS = ["createdAt", "updatedAt", "name", "status"] as const;

export type LeadSortField = (typeof LEAD_SORT_FIELDS)[number];

export class ListLeadsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: "关键字，支持匹配线索名称、联系人和手机号。"
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: "线索来源。"
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: "线索状态。",
    enum: LeadStatus
  })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({
    description: "归属人 ID。"
  })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
