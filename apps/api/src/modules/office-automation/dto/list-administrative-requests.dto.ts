/** OA DTO：负责约束行政申请检索接口的查询参数。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { AdministrativeRequestStatus, AdministrativeRequestType } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, Matches } from "class-validator";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const emptyStringToUndefined = ({ value }: { value: unknown }) => (value === "" ? undefined : value);

export class ListAdministrativeRequestsDto {
  @ApiPropertyOptional({
    description: "申请类型。",
    enum: AdministrativeRequestType
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsEnum(AdministrativeRequestType)
  type?: AdministrativeRequestType;

  @ApiPropertyOptional({
    description: "申请状态。",
    enum: AdministrativeRequestStatus
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsEnum(AdministrativeRequestStatus)
  status?: AdministrativeRequestStatus;

  @ApiPropertyOptional({
    description: "申请人 ID。"
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  applicantId?: string;

  @ApiPropertyOptional({
    description: "审批人 ID。"
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  approverId?: string;

  @ApiPropertyOptional({
    description: "开始日期，格式 YYYY-MM-DD。"
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, {
    message: "开始日期格式必须为 YYYY-MM-DD。"
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: "结束日期，格式 YYYY-MM-DD。"
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, {
    message: "结束日期格式必须为 YYYY-MM-DD。"
  })
  endDate?: string;
}
