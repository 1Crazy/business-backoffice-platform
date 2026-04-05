import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FollowUpEntityType, ReminderStatus } from "@prisma/client";

import { PaginatedResponseDto } from "../../../common/pagination/paginated-response.dto";

class ReminderOwnerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  displayName!: string;
}

class ReminderLeadSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  contactName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;
}

class ReminderCustomerSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  contactName?: string | null;
}

class ReminderFollowUpSummaryDto {
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

class ReminderListItemDto {
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
    type: () => ReminderLeadSummaryDto,
    nullable: true
  })
  lead?: ReminderLeadSummaryDto | null;

  @ApiPropertyOptional({
    type: () => ReminderCustomerSummaryDto,
    nullable: true
  })
  customer?: ReminderCustomerSummaryDto | null;

  @ApiPropertyOptional({
    type: () => ReminderFollowUpSummaryDto,
    nullable: true
  })
  followUp?: ReminderFollowUpSummaryDto | null;

  @ApiProperty({
    type: () => ReminderOwnerDto
  })
  owner!: ReminderOwnerDto;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class PaginatedLeadRemindersResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    type: () => [ReminderListItemDto]
  })
  items!: ReminderListItemDto[];
}
