/** 批任务 VO：负责定义导入导出任务和失败明细的接口契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BatchTaskCategory, BatchTaskStatus } from "@prisma/client";

class BatchTaskOperatorVo {
  @ApiProperty({
    description: "操作人 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "操作人名称。"
  })
  displayName!: string;
}

export class BatchTaskFailureVo {
  @ApiProperty({
    description: "失败明细 ID。"
  })
  id!: string;

  @ApiPropertyOptional({
    description: "失败行号。",
    nullable: true
  })
  rowNumber?: number | null;

  @ApiPropertyOptional({
    description: "失败标识。",
    nullable: true
  })
  identifier?: string | null;

  @ApiProperty({
    description: "失败原因。"
  })
  reason!: string;

  @ApiPropertyOptional({
    description: "失败上下文。该字段为动态对象，用于补充失败行对应的原始值或校验细节。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  payload?: Record<string, unknown> | null;

  @ApiProperty({
    description: "创建时间。",
    format: "date-time"
  })
  createdAt!: string;
}

export class BatchTaskVo {
  @ApiProperty({
    description: "任务 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "任务分类。",
    enum: BatchTaskCategory
  })
  category!: BatchTaskCategory;

  @ApiProperty({
    description: "资源类型。"
  })
  resourceType!: string;

  @ApiProperty({
    description: "任务标题。"
  })
  label!: string;

  @ApiProperty({
    description: "任务状态。",
    enum: BatchTaskStatus
  })
  status!: BatchTaskStatus;

  @ApiProperty({
    description: "任务进度，0-100。"
  })
  progress!: number;

  @ApiProperty({
    description: "总记录数。"
  })
  totalCount!: number;

  @ApiProperty({
    description: "成功记录数。"
  })
  successCount!: number;

  @ApiProperty({
    description: "失败记录数。"
  })
  failureCount!: number;

  @ApiPropertyOptional({
    description: "筛选快照。该字段为动态对象，用于记录导出任务实际使用的筛选条件。",
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  filterSnapshot?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: "任务摘要。",
    nullable: true
  })
  summary?: string | null;

  @ApiPropertyOptional({
    description: "失败摘要。",
    nullable: true
  })
  failureSummary?: string | null;

  @ApiPropertyOptional({
    description: "输入文件名。",
    nullable: true
  })
  inputFileName?: string | null;

  @ApiPropertyOptional({
    description: "结果文件名。",
    nullable: true
  })
  resultFileName?: string | null;

  @ApiPropertyOptional({
    description: "失败明细文件名。",
    nullable: true
  })
  failureFileName?: string | null;

  @ApiProperty({
    description: "操作人。",
    type: () => BatchTaskOperatorVo
  })
  operator!: BatchTaskOperatorVo;

  @ApiPropertyOptional({
    description: "开始时间。",
    format: "date-time",
    nullable: true
  })
  startedAt?: string | null;

  @ApiPropertyOptional({
    description: "结束时间。",
    format: "date-time",
    nullable: true
  })
  finishedAt?: string | null;

  @ApiProperty({
    description: "创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "更新时间。",
    format: "date-time"
  })
  updatedAt!: string;
}
