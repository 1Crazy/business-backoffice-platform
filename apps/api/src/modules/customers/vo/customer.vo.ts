import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { AttachmentVo, FollowUpVo } from "../../../common/vo/entity.vo";
import { UserSummaryVo } from "../../../common/vo/access-control.vo";
import { PaginatedResponseDto } from "../../../common/pagination/paginated-response.dto";

export class CustomerTagVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  color?: string | null;
}

export class CustomerTagRelationVo {
  @ApiProperty({
    type: () => CustomerTagVo
  })
  tag!: CustomerTagVo;
}

export class CustomerVo {
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
    type: () => UserSummaryVo
  })
  owner!: UserSummaryVo;

  @ApiProperty({
    type: () => [CustomerTagRelationVo]
  })
  tags!: CustomerTagRelationVo[];

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

export class PaginatedCustomersResponseVo extends PaginatedResponseDto {
  @ApiProperty({
    type: () => [CustomerVo]
  })
  items!: CustomerVo[];
}

export class CustomerFollowUpVo extends FollowUpVo {}
