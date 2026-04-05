import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FollowUpEntityType, LeadStatus, ReminderStatus } from "@prisma/client";

import { UserSummaryVo } from "../../../common/vo/access-control.vo";
import { AttachmentVo, FollowUpVo } from "../../../common/vo/entity.vo";
import { PaginatedResponseDto } from "../../../common/pagination/paginated-response.dto";

export class LeadConvertedCustomerSummaryVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  contactName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  source?: string | null;

  @ApiPropertyOptional({ nullable: true })
  status?: string | null;

  @ApiProperty()
  ownerId!: string;
}

export class LeadVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  contactName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  source?: string | null;

  @ApiProperty({
    enum: LeadStatus
  })
  status!: LeadStatus;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty({
    type: () => UserSummaryVo
  })
  owner!: UserSummaryVo;

  @ApiPropertyOptional({ nullable: true })
  convertedCustomerId?: string | null;

  @ApiPropertyOptional({
    type: () => LeadConvertedCustomerSummaryVo,
    nullable: true
  })
  convertedCustomer?: LeadConvertedCustomerSummaryVo | null;

  @ApiPropertyOptional({
    type: () => [AttachmentVo]
  })
  attachments?: AttachmentVo[];

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class ReminderLeadSummaryVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  contactName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;
}

export class ReminderCustomerSummaryVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  contactName?: string | null;
}

export class ReminderFollowUpSummaryVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional({
    format: "date-time",
    nullable: true
  })
  nextFollowUpAt?: string | null;
}

export class LeadReminderVo {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: FollowUpEntityType
  })
  entityType!: FollowUpEntityType;

  @ApiProperty({
    enum: ReminderStatus
  })
  status!: ReminderStatus;

  @ApiProperty({
    format: "date-time"
  })
  remindAt!: string;

  @ApiPropertyOptional({
    type: () => ReminderLeadSummaryVo,
    nullable: true
  })
  lead?: ReminderLeadSummaryVo | null;

  @ApiPropertyOptional({
    type: () => ReminderCustomerSummaryVo,
    nullable: true
  })
  customer?: ReminderCustomerSummaryVo | null;

  @ApiPropertyOptional({
    type: () => ReminderFollowUpSummaryVo,
    nullable: true
  })
  followUp?: ReminderFollowUpSummaryVo | null;

  @ApiProperty({
    type: () => UserSummaryVo
  })
  owner!: UserSummaryVo;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class PaginatedLeadsResponseVo extends PaginatedResponseDto {
  @ApiProperty({
    type: () => [LeadVo]
  })
  items!: LeadVo[];
}

export class PaginatedLeadRemindersResponseVo extends PaginatedResponseDto {
  @ApiProperty({
    type: () => [LeadReminderVo]
  })
  items!: LeadReminderVo[];
}

export class LeadFollowUpVo extends FollowUpVo {}
