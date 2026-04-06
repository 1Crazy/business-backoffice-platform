/** sales-opportunities 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { OpportunityStage } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

import { PaginationQueryDto } from "@/common/pagination/pagination-query.dto";
import { OpportunityResultStatus } from "../sales-opportunity.constants";

export const SALES_OPPORTUNITY_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "name",
  "stage",
  "expectedAmount",
  "expectedCloseDate",
  "closedAt"
] as const;

export type SalesOpportunitySortField = (typeof SALES_OPPORTUNITY_SORT_FIELDS)[number];

export class ListSalesOpportunitiesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: "关键字，支持匹配商机名称、客户名称和来源线索名称。"
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: "关联客户 ID。"
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: "来源线索 ID。"
  })
  @IsOptional()
  @IsString()
  sourceLeadId?: string;

  @ApiPropertyOptional({
    description: "负责人 ID。"
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({
    description: "当前阶段。",
    enum: OpportunityStage
  })
  @IsOptional()
  @IsEnum(OpportunityStage)
  stage?: OpportunityStage;

  @ApiPropertyOptional({
    description: "结果状态。",
    enum: OpportunityResultStatus
  })
  @IsOptional()
  @IsEnum(OpportunityResultStatus)
  resultStatus?: OpportunityResultStatus;

  @ApiPropertyOptional({
    description: "预计成交开始时间。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  expectedCloseDateStart?: string;

  @ApiPropertyOptional({
    description: "预计成交结束时间。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  expectedCloseDateEnd?: string;

  @ApiPropertyOptional({
    description: "收口开始时间。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  closedAtStart?: string;

  @ApiPropertyOptional({
    description: "收口结束时间。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  closedAtEnd?: string;
}
