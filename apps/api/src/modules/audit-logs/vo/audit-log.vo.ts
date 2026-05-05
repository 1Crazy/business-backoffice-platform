/** audit-logs 模块 VO：负责 Swagger 与接口返回契约，避免直接暴露持久化结构。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AuditActionType } from "@prisma/client";

import { PaginatedResponseDto } from "@/common/pagination/paginated-response.dto";

export class AuditLogVo {
  @ApiProperty({
    description: "审计日志 ID。"
  })
  id!: string;

  @ApiPropertyOptional({
    description: "操作人 ID。",
nullable: true
  })
  actorId?: string | null;

  @ApiPropertyOptional({
    description: "操作人名称。",
nullable: true
  })
  actorName?: string | null;

  @ApiProperty({
    description: "审计动作类型。",
enum: AuditActionType
  })
  actionType!: AuditActionType;

  @ApiProperty({
    description: "审计目标类型。"
  })
  targetType!: string;

  @ApiPropertyOptional({
    description: "审计目标 ID。",
nullable: true
  })
  targetId?: string | null;

  @ApiPropertyOptional({
    description: "附加明细。该字段为动态对象，用于记录本次审计事件的扩展上下文。",
    type: "object",
    additionalProperties: true,
    nullable: true
  })
  detail?: Record<string, unknown> | null;

  @ApiProperty({
    description: "创建时间。",
format: "date-time"
  })
  createdAt!: string;
}

export class PaginatedAuditLogsResponseVo extends PaginatedResponseDto {
  @ApiProperty({
    type: () => [AuditLogVo]
  })
  items!: AuditLogVo[];
}
