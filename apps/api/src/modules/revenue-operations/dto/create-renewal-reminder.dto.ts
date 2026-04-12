import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateRenewalReminderDto {
  @ApiProperty({
    description: "客户 ID。"
  })
  @IsString()
  customerId!: string;

  @ApiProperty({
    description: "合同 ID。"
  })
  @IsString()
  contractId!: string;

  @ApiPropertyOptional({
    description: "商机 ID。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  opportunityId?: string;

  @ApiProperty({
    description: "提醒标题。"
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: "提醒时间。"
  })
  @IsDateString()
  remindAt!: string;

  @ApiPropertyOptional({
    description: "提醒说明。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
