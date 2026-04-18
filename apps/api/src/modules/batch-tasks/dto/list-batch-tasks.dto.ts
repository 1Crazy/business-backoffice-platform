/** 批任务 DTO：负责约束任务列表查询条件。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { BatchTaskCategory, BatchTaskStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListBatchTasksDto {
  @ApiPropertyOptional({
    description: "任务分类。",
    enum: BatchTaskCategory
  })
  @IsOptional()
  @IsEnum(BatchTaskCategory)
  category?: BatchTaskCategory;

  @ApiPropertyOptional({
    description: "任务状态。",
    enum: BatchTaskStatus
  })
  @IsOptional()
  @IsEnum(BatchTaskStatus)
  status?: BatchTaskStatus;

  @ApiPropertyOptional({
    description: "资源类型。"
  })
  @IsOptional()
  @IsString()
  resourceType?: string;
}
