import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LeadStatus } from "@prisma/client";

import { PaginatedResponseDto } from "../../../common/pagination/paginated-response.dto";

class LeadListOwnerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiProperty({
    enum: ["ACTIVE", "DISABLED"]
  })
  status!: "ACTIVE" | "DISABLED";

  @ApiPropertyOptional({ nullable: true })
  departmentId?: string | null;
}

class LeadConvertedCustomerDto {
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

class LeadListItemDto {
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

  @ApiPropertyOptional({ nullable: true })
  convertedCustomerId?: string | null;

  @ApiProperty({
    type: () => LeadListOwnerDto
  })
  owner!: LeadListOwnerDto;

  @ApiPropertyOptional({
    type: () => LeadConvertedCustomerDto,
    nullable: true
  })
  convertedCustomer?: LeadConvertedCustomerDto | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class PaginatedLeadsResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    type: () => [LeadListItemDto]
  })
  items!: LeadListItemDto[];
}
