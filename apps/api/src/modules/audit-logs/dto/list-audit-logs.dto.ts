import { ApiPropertyOptional } from "@nestjs/swagger";
import { AuditActionType } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

import { PaginationQueryDto } from "../../../common/pagination/pagination-query.dto";

export const AUDIT_LOG_SORT_FIELDS = ["createdAt", "actionType", "targetType", "actorName"] as const;

export type AuditLogSortField = (typeof AUDIT_LOG_SORT_FIELDS)[number];

export class ListAuditLogsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: "操作类型。",
    enum: AuditActionType
  })
  @IsOptional()
  @IsEnum(AuditActionType)
  actionType?: AuditActionType;

  @ApiPropertyOptional({
    description: "对象类型。"
  })
  @IsOptional()
  @IsString()
  targetType?: string;

  @ApiPropertyOptional({
    description: "对象标识。"
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({
    description: "操作人 ID。"
  })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({
    description: "操作人姓名模糊查询。"
  })
  @IsOptional()
  @IsString()
  actorName?: string;

  @ApiPropertyOptional({
    description: "开始时间。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "结束时间。",
    format: "date-time"
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
