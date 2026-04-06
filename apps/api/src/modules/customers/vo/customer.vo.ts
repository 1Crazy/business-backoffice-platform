/** customers 模块 VO：负责 Swagger 与接口返回契约，避免直接暴露持久化结构。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { AttachmentVo, FollowUpVo } from "@/common/vo/entity.vo";
import { UserSummaryVo } from "@/common/vo/access-control.vo";
import { PaginatedResponseDto } from "@/common/pagination/paginated-response.dto";

export class CustomerTagVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "名称。"
  })
  name!: string;

  @ApiPropertyOptional({
    description: "颜色值。",
nullable: true
  })
  color?: string | null;
}

export class CustomerTagRelationVo {
  @ApiProperty({
    description: "标签详情。",
    type: () => CustomerTagVo
  })
  tag!: CustomerTagVo;
}

export class CustomerVo {
  @ApiProperty({
    description: "记录 ID。"
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
    description: "电子邮箱。",
nullable: true
  })
  email?: string | null;

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

  @ApiPropertyOptional({
    description: "备注。",
nullable: true
  })
  notes?: string | null;

  @ApiProperty({
    description: "负责人 ID。"
  })
  ownerId!: string;

  @ApiProperty({
    description: "客户负责人摘要信息。",
    type: () => UserSummaryVo
  })
  owner!: UserSummaryVo;

  @ApiProperty({
    description: "客户标签关系列表。",
    type: () => [CustomerTagRelationVo]
  })
  tags!: CustomerTagRelationVo[];

  @ApiPropertyOptional({
    description: "客户附件列表。",
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

export class PaginatedCustomersResponseVo extends PaginatedResponseDto {
  @ApiProperty({
    description: "当前页客户列表。",
    type: () => [CustomerVo]
  })
  items!: CustomerVo[];
}

export class CustomerFollowUpVo extends FollowUpVo {}
