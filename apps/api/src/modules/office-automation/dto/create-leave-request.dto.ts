/** OA DTO：负责约束请假申请创建接口的输入契约。 */
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export class CreateLeaveRequestDto {
  @ApiProperty({
    description: "请假类型，例如 ANNUAL、SICK。"
  })
  @IsString()
  @MinLength(2)
  leaveType!: string;

  @ApiProperty({
    description: "开始时间，格式为 YYYY-MM-DD HH:mm:ss。"
  })
  @IsString()
  @Matches(DATE_TIME_PATTERN, {
    message: "开始时间格式必须为 YYYY-MM-DD HH:mm:ss。"
  })
  startAt!: string;

  @ApiProperty({
    description: "结束时间，格式为 YYYY-MM-DD HH:mm:ss。"
  })
  @IsString()
  @Matches(DATE_TIME_PATTERN, {
    message: "结束时间格式必须为 YYYY-MM-DD HH:mm:ss。"
  })
  endAt!: string;

  @ApiProperty({
    description: "请假事由。"
  })
  @IsString()
  @MinLength(4)
  reason!: string;
}
