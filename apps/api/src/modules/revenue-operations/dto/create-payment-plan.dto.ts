import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreatePaymentPlanDto {
  @ApiProperty({
    description: "商机 ID。"
  })
  @IsString()
  opportunityId!: string;

  @ApiProperty({
    description: "客户 ID。"
  })
  @IsString()
  customerId!: string;

  @ApiPropertyOptional({
    description: "合同 ID。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiProperty({
    description: "回款计划标题。"
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: "计划金额。"
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  plannedAmount!: number;

  @ApiProperty({
    description: "计划日期。"
  })
  @IsDateString()
  plannedDate!: string;

  @ApiPropertyOptional({
    description: "补充说明。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
