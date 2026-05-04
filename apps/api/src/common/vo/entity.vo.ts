/** 共享 VO：负责多个业务模块复用的接口返回契约定义。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AttachmentBusinessType, AttachmentScanStatus, ReminderStatus } from "@prisma/client";

import { UserSummaryVo } from "./access-control.vo";

export class AttachmentVo {
  @ApiProperty({
    description: "附件 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "附件所属业务类型。",
    enum: AttachmentBusinessType
  })
  businessType!: AttachmentBusinessType;

  @ApiProperty({
    description: "附件归属的业务单据 ID。"
  })
  businessId!: string;

  @ApiProperty({
    description: "存储文件名。"
  })
  fileName!: string;

  @ApiProperty({
    description: "原始文件名。"
  })
  originalName!: string;

  @ApiProperty({
    description: "文件 MIME 类型。"
  })
  mimeType!: string;

  @ApiProperty({
    description: "文件大小，单位字节。"
  })
  size!: number;

  @ApiProperty({
    description: "附件扫描状态。",
    enum: AttachmentScanStatus
  })
  scanStatus!: AttachmentScanStatus;

  @ApiPropertyOptional({
    description: "扫描器提供方。",
    nullable: true
  })
  scanProvider?: string | null;

  @ApiPropertyOptional({
    description: "扫描结果摘要。",
    nullable: true
  })
  scanMessage?: string | null;

  @ApiPropertyOptional({
    description: "扫描完成时间。",
    format: "date-time",
    nullable: true
  })
  scannedAt?: string | null;

  @ApiProperty({
    description: "创建时间。",
format: "date-time"
  })
  createdAt!: string;
}

export class ReminderVo {
  @ApiProperty({
    description: "提醒 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "提醒时间。",
format: "date-time"
  })
  remindAt!: string;

  @ApiProperty({
    description: "状态。",
enum: ReminderStatus
  })
  status!: ReminderStatus;
}

export class FollowUpVo {
  @ApiProperty({
    description: "跟进记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "内容。"
  })
  content!: string;

  @ApiPropertyOptional({
    description: "下次跟进时间。",
format: "date-time",
    nullable: true
  })
  nextFollowUpAt?: string | null;

  @ApiProperty({
    description: "创建时间。",
format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "跟进记录创建人摘要信息。",
    type: () => UserSummaryVo
  })
  createdBy!: UserSummaryVo;

  @ApiPropertyOptional({
    description: "与当前跟进关联的提醒信息；未创建提醒时为空。",
    type: () => ReminderVo,
    nullable: true
  })
  reminder?: ReminderVo | null;
}
