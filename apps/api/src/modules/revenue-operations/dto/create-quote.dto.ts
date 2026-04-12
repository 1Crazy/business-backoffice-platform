import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateQuoteDto {
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
    description: "报价标题。"
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: "报价金额。"
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    description: "报价日期。"
  })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional({
    description: "报价有效期。"
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: "补充说明。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
