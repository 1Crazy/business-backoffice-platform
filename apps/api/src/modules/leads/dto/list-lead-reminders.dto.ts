/** leads 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { ReminderStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

import { PaginationQueryDto } from "@/common/pagination/pagination-query.dto";

export const REMINDER_SORT_FIELDS = ["remindAt", "createdAt", "updatedAt"] as const;

export type ReminderSortField = (typeof REMINDER_SORT_FIELDS)[number];

export class ListLeadRemindersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: "归属人 ID。"
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({
    description: "提醒状态，默认仅返回待处理提醒。",
    enum: ReminderStatus,
    default: ReminderStatus.PENDING
  })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;
}
