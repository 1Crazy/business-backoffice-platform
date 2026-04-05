import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { PaginatedResponseDto } from "../../../common/pagination/paginated-response.dto";

class CustomerListOwnerDto {
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

class CustomerTagSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  color?: string | null;
}

class CustomerTagRelationDto {
  @ApiProperty({
    type: () => CustomerTagSummaryDto
  })
  tag!: CustomerTagSummaryDto;
}

class CustomerListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  contactName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  source?: string | null;

  @ApiPropertyOptional({ nullable: true })
  status?: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty({
    type: () => CustomerListOwnerDto
  })
  owner!: CustomerListOwnerDto;

  @ApiProperty({
    type: () => [CustomerTagRelationDto]
  })
  tags!: CustomerTagRelationDto[];

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class PaginatedCustomersResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    type: () => [CustomerListItemDto]
  })
  items!: CustomerListItemDto[];
}
