import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AttachmentBusinessType, ReminderStatus } from "@prisma/client";

import { UserSummaryVo } from "./access-control.vo";

export class AttachmentVo {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: AttachmentBusinessType
  })
  businessType!: AttachmentBusinessType;

  @ApiProperty()
  businessId!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  originalName!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  size!: number;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;
}

export class ReminderVo {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    format: "date-time"
  })
  remindAt!: string;

  @ApiProperty({
    enum: ReminderStatus
  })
  status!: ReminderStatus;
}

export class FollowUpVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional({
    format: "date-time",
    nullable: true
  })
  nextFollowUpAt?: string | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    type: () => UserSummaryVo
  })
  createdBy!: UserSummaryVo;

  @ApiPropertyOptional({
    type: () => ReminderVo,
    nullable: true
  })
  reminder?: ReminderVo | null;
}
