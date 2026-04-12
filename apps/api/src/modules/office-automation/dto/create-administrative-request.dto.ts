/** OA DTO：负责约束高频行政申请创建接口的输入契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AdministrativeRequestType } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;

export class CreateAdministrativeRequestDto {
  @ApiProperty({
    description: "申请类型。",
    enum: AdministrativeRequestType
  })
  @IsEnum(AdministrativeRequestType)
  type!: AdministrativeRequestType;

  @ApiProperty({
    description: "申请标题。"
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title!: string;

  @ApiProperty({
    description: "申请说明。"
  })
  @IsString()
  @MinLength(4)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({
    description: "附件名称列表。",
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentNames?: string[];

  @ApiPropertyOptional({
    description: "报销发生日期。"
  })
  @IsOptional()
  @IsString()
  @Matches(DATE_TIME_PATTERN, {
    message: "发生日期格式必须为 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss。"
  })
  expenseDate?: string;

  @ApiPropertyOptional({
    description: "报销类别。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  expenseCategory?: string;

  @ApiPropertyOptional({
    description: "报销金额。"
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: "收款对象或报销对象。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  payeeName?: string;

  @ApiPropertyOptional({
    description: "出差开始时间。"
  })
  @IsOptional()
  @IsString()
  @Matches(DATE_TIME_PATTERN, {
    message: "出差开始时间格式必须为 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss。"
  })
  startAt?: string;

  @ApiPropertyOptional({
    description: "出差结束时间。"
  })
  @IsOptional()
  @IsString()
  @Matches(DATE_TIME_PATTERN, {
    message: "出差结束时间格式必须为 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss。"
  })
  endAt?: string;

  @ApiPropertyOptional({
    description: "出差目的地。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  destination?: string;

  @ApiPropertyOptional({
    description: "交通方式。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  transportation?: string;

  @ApiPropertyOptional({
    description: "预估费用。"
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedAmount?: number;

  @ApiPropertyOptional({
    description: "采购物品。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  itemName?: string;

  @ApiPropertyOptional({
    description: "采购数量。"
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: "预算金额。"
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAmount?: number;

  @ApiPropertyOptional({
    description: "期望到位时间。"
  })
  @IsOptional()
  @IsString()
  @Matches(DATE_TIME_PATTERN, {
    message: "期望到位时间格式必须为 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss。"
  })
  neededBy?: string;

  @ApiPropertyOptional({
    description: "文件名称。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentName?: string;

  @ApiPropertyOptional({
    description: "用印类型。"
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sealType?: string;

  @ApiPropertyOptional({
    description: "用印时间。"
  })
  @IsOptional()
  @IsString()
  @Matches(DATE_TIME_PATTERN, {
    message: "用印时间格式必须为 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss。"
  })
  useDate?: string;

  @ApiPropertyOptional({
    description: "用印份数。"
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  copyCount?: number;
}
