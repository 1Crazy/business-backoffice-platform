import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateContractDto {
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

  @ApiProperty({
    description: "合同标题。"
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: "合同金额。"
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({
    description: "合同开始日期。"
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: "合同结束日期。"
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: "签约时间。"
  })
  @IsOptional()
  @IsDateString()
  signedAt?: string;

  @ApiPropertyOptional({
    description: "补充说明。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
