/** sales-opportunities 模块 VO：负责 Swagger 与接口返回契约，避免直接暴露持久化结构。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OpportunityStage } from "@prisma/client";

import { PaginatedResponseDto } from "@/common/pagination/paginated-response.dto";
import { UserSummaryVo } from "@/common/vo/access-control.vo";
import { OpportunityResultStatus } from "../sales-opportunity.constants";

export class OpportunityCustomerSummaryVo {
  @ApiProperty({
    description: "客户 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "客户名称。"
  })
  name!: string;

  @ApiPropertyOptional({
    description: "客户联系人。",
    nullable: true
  })
  contactName?: string | null;

  @ApiPropertyOptional({
    description: "客户电话。",
    nullable: true
  })
  phone?: string | null;
}

export class OpportunityLeadSummaryVo {
  @ApiProperty({
    description: "线索 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "线索名称。"
  })
  name!: string;

  @ApiPropertyOptional({
    description: "线索联系人。",
    nullable: true
  })
  contactName?: string | null;

  @ApiPropertyOptional({
    description: "线索电话。",
    nullable: true
  })
  phone?: string | null;
}

export class OpportunityStageHistoryVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiPropertyOptional({
    description: "变更前阶段。",
    enum: OpportunityStage,
    nullable: true
  })
  fromStage?: OpportunityStage | null;

  @ApiProperty({
    description: "变更后阶段。",
    enum: OpportunityStage
  })
  toStage!: OpportunityStage;

  @ApiPropertyOptional({
    description: "阶段备注。",
    nullable: true
  })
  comment?: string | null;

  @ApiProperty({
    description: "操作者。",
    type: () => UserSummaryVo
  })
  createdBy!: UserSummaryVo;

  @ApiProperty({
    description: "创建时间。",
    format: "date-time"
  })
  createdAt!: string;
}

export class SalesOpportunityVo {
  @ApiProperty({
    description: "商机 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "商机名称。"
  })
  name!: string;

  @ApiProperty({
    description: "关联客户 ID。"
  })
  customerId!: string;

  @ApiProperty({
    description: "客户摘要信息。",
    type: () => OpportunityCustomerSummaryVo
  })
  customer!: OpportunityCustomerSummaryVo;

  @ApiPropertyOptional({
    description: "来源线索 ID。",
    nullable: true
  })
  sourceLeadId?: string | null;

  @ApiPropertyOptional({
    description: "来源线索摘要信息。",
    type: () => OpportunityLeadSummaryVo,
    nullable: true
  })
  sourceLead?: OpportunityLeadSummaryVo | null;

  @ApiProperty({
    description: "负责人 ID。"
  })
  ownerId!: string;

  @ApiProperty({
    description: "负责人摘要信息。",
    type: () => UserSummaryVo
  })
  owner!: UserSummaryVo;

  @ApiProperty({
    description: "当前阶段。",
    enum: OpportunityStage
  })
  stage!: OpportunityStage;

  @ApiProperty({
    description: "结果状态。",
    enum: OpportunityResultStatus
  })
  resultStatus!: OpportunityResultStatus;

  @ApiProperty({
    description: "预计金额。"
  })
  expectedAmount!: number;

  @ApiProperty({
    description: "预计成交日期。",
    format: "date-time"
  })
  expectedCloseDate!: string;

  @ApiProperty({
    description: "下一步动作。"
  })
  nextAction!: string;

  @ApiPropertyOptional({
    description: "补充说明。",
    nullable: true
  })
  notes?: string | null;

  @ApiPropertyOptional({
    description: "收口时间。",
    format: "date-time",
    nullable: true
  })
  closedAt?: string | null;

  @ApiPropertyOptional({
    description: "输单原因。",
    nullable: true
  })
  lostReason?: string | null;

  @ApiPropertyOptional({
    description: "阶段轨迹。",
    type: () => [OpportunityStageHistoryVo]
  })
  stageHistory?: OpportunityStageHistoryVo[];

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

export class PaginatedSalesOpportunitiesResponseVo extends PaginatedResponseDto {
  @ApiProperty({
    description: "当前页商机列表。",
    type: () => [SalesOpportunityVo]
  })
  items!: SalesOpportunityVo[];
}
