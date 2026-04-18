/** system-governance 模块 DTO：负责调度任务治理更新入参约束。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { SchedulerJobStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateSchedulerJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    nullable: true
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cronExpression?: string;

  @ApiPropertyOptional({
    enum: SchedulerJobStatus
  })
  @IsOptional()
  @IsEnum(SchedulerJobStatus)
  status?: SchedulerJobStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerName?: string;
}
