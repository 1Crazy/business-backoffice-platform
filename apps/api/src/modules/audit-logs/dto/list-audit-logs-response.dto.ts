import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AuditActionType } from "@prisma/client";

import { PaginatedResponseDto } from "../../../common/pagination/paginated-response.dto";

class AuditLogItemDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  actorId?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  actorName?: string | null;

  @ApiProperty({
    enum: AuditActionType
  })
  actionType!: AuditActionType;

  @ApiProperty()
  targetType!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  targetId?: string | null;

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: true,
    nullable: true
  })
  detail?: Record<string, unknown> | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;
}

export class PaginatedAuditLogsResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    type: () => [AuditLogItemDto]
  })
  items!: AuditLogItemDto[];
}
