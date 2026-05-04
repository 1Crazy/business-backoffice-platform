/** leads 模块 VO：负责 Swagger 与接口返回契约，避免直接暴露持久化结构。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FollowUpEntityType, LeadStatus, ReminderStatus } from "@prisma/client";

import { UserSummaryVo } from "@/common/vo/access-control.vo";
import { AttachmentVo, FollowUpVo } from "@/common/vo/entity.vo";
import { PaginatedResponseDto } from "@/common/pagination/paginated-response.dto";

export class LeadConvertedCustomerSummaryVo {
  @ApiProperty({
    description: "转化后客户 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "名称。"
  })
  name!: string;

  @ApiPropertyOptional({
    description: "联系人姓名。",
nullable: true
  })
  contactName?: string | null;

  @ApiPropertyOptional({
    description: "联系电话。",
nullable: true
  })
  phone?: string | null;

  @ApiPropertyOptional({
    description: "来源。",
nullable: true
  })
  source?: string | null;

  @ApiPropertyOptional({
    description: "状态。",
nullable: true
  })
  status?: string | null;

  @ApiProperty({
    description: "当前负责该客户的员工 ID。"
  })
  ownerId!: string;
}

export class LeadVo {
  @ApiProperty({
    description: "线索 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "名称。"
  })
  name!: string;

  @ApiPropertyOptional({
    description: "联系人姓名。",
nullable: true
  })
  contactName?: string | null;

  @ApiPropertyOptional({
    description: "联系电话。",
nullable: true
  })
  phone?: string | null;

  @ApiPropertyOptional({
    description: "来源。",
nullable: true
  })
  source?: string | null;

  @ApiProperty({
    description: "状态。",
enum: LeadStatus
  })
  status!: LeadStatus;

  @ApiPropertyOptional({
    description: "备注。",
nullable: true
  })
  notes?: string | null;

  @ApiProperty({
    description: "当前负责该线索的员工 ID。"
  })
  ownerId!: string;

  @ApiProperty({
    description: "线索负责人摘要信息。",
    type: () => UserSummaryVo
  })
  owner!: UserSummaryVo;

  @ApiPropertyOptional({
    description: "转化后的客户 ID。",
nullable: true
  })
  convertedCustomerId?: string | null;

  @ApiPropertyOptional({
    description: "转化后的客户摘要信息；未转客户时为空。",
    type: () => LeadConvertedCustomerSummaryVo,
    nullable: true
  })
  convertedCustomer?: LeadConvertedCustomerSummaryVo | null;

  @ApiPropertyOptional({
    description: "线索附件列表。",
    type: () => [AttachmentVo]
  })
  attachments?: AttachmentVo[];

  @ApiProperty({
    description: "创建时间。",
format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "更新时间。",
format: "date-time"
  })
  updatedAt!: string;
}

export class ReminderLeadSummaryVo {
  @ApiProperty({
    description: "线索 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "名称。"
  })
  name!: string;

  @ApiPropertyOptional({
    description: "联系人姓名。",
nullable: true
  })
  contactName?: string | null;

  @ApiPropertyOptional({
    description: "联系电话。",
nullable: true
  })
  phone?: string | null;
}

export class ReminderCustomerSummaryVo {
  @ApiProperty({
    description: "客户 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "名称。"
  })
  name!: string;

  @ApiPropertyOptional({
    description: "联系人姓名。",
nullable: true
  })
  contactName?: string | null;
}

export class ReminderFollowUpSummaryVo {
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
}

export class LeadReminderVo {
  @ApiProperty({
    description: "线索跟进提醒 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "提醒所属的跟进实体类型。",
    enum: FollowUpEntityType
  })
  entityType!: FollowUpEntityType;

  @ApiProperty({
    description: "状态。",
enum: ReminderStatus
  })
  status!: ReminderStatus;

  @ApiProperty({
    description: "提醒时间。",
format: "date-time"
  })
  remindAt!: string;

  @ApiPropertyOptional({
    description: "提醒关联的线索摘要信息；当提醒来自客户跟进时为空。",
    type: () => ReminderLeadSummaryVo,
    nullable: true
  })
  lead?: ReminderLeadSummaryVo | null;

  @ApiPropertyOptional({
    description: "提醒关联的客户摘要信息；当提醒来自线索跟进时为空。",
    type: () => ReminderCustomerSummaryVo,
    nullable: true
  })
  customer?: ReminderCustomerSummaryVo | null;

  @ApiPropertyOptional({
    description: "生成当前提醒的跟进摘要信息。",
    type: () => ReminderFollowUpSummaryVo,
    nullable: true
  })
  followUp?: ReminderFollowUpSummaryVo | null;

  @ApiProperty({
    description: "当前提醒归属人的摘要信息。",
    type: () => UserSummaryVo
  })
  owner!: UserSummaryVo;

  @ApiProperty({
    description: "创建时间。",
format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "更新时间。",
format: "date-time"
  })
  updatedAt!: string;
}

export class PaginatedLeadsResponseVo extends PaginatedResponseDto {
  @ApiProperty({
    description: "当前页线索列表。",
    type: () => [LeadVo]
  })
  items!: LeadVo[];
}

export class PaginatedLeadRemindersResponseVo extends PaginatedResponseDto {
  @ApiProperty({
    description: "当前页提醒列表。",
    type: () => [LeadReminderVo]
  })
  items!: LeadReminderVo[];
}

export class LeadFollowUpVo extends FollowUpVo {}
