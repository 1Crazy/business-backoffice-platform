import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreatePaymentRecordDto {
  @ApiProperty({
    description: "回款计划 ID。"
  })
  @IsString()
  paymentPlanId!: string;

  @ApiProperty({
    description: "回款金额。"
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({
    description: "回款时间。"
  })
  @IsDateString()
  receivedAt!: string;

  @ApiPropertyOptional({
    description: "回款说明。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
