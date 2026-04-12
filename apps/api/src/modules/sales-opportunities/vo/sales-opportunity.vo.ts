/** sales-opportunities 模块 VO：负责 Swagger 与接口返回契约，避免直接暴露持久化结构。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ContractStatus,
  OpportunityStage,
  PaymentPlanStatus,
  QuoteStatus,
  RenewalReminderStatus
} from "@prisma/client";

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

export class QuoteSummaryVo {
  @ApiProperty({
    description: "报价单 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "报价单编号。"
  })
  quoteNo!: string;

  @ApiProperty({
    description: "报价标题。"
  })
  title!: string;

  @ApiProperty({
    description: "报价金额。"
  })
  amount!: number;

  @ApiProperty({
    description: "报价状态。",
    enum: QuoteStatus
  })
  status!: QuoteStatus;

  @ApiPropertyOptional({
    description: "报价日期。",
    format: "date-time",
    nullable: true
  })
  issuedAt?: string | null;

  @ApiPropertyOptional({
    description: "报价有效期。",
    format: "date-time",
    nullable: true
  })
  expiresAt?: string | null;
}

export class ContractSummaryVo {
  @ApiProperty({
    description: "合同 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "合同编号。"
  })
  contractNo!: string;

  @ApiProperty({
    description: "合同标题。"
  })
  title!: string;

  @ApiProperty({
    description: "合同金额。"
  })
  amount!: number;

  @ApiProperty({
    description: "合同状态。",
    enum: ContractStatus
  })
  status!: ContractStatus;

  @ApiProperty({
    description: "合同开始日期。",
    format: "date-time"
  })
  startDate!: string;

  @ApiProperty({
    description: "合同结束日期。",
    format: "date-time"
  })
  endDate!: string;

  @ApiPropertyOptional({
    description: "签约时间。",
    format: "date-time",
    nullable: true
  })
  signedAt?: string | null;
}

export class PaymentPlanSummaryVo {
  @ApiProperty({
    description: "回款计划 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "回款计划标题。"
  })
  title!: string;

  @ApiProperty({
    description: "计划金额。"
  })
  plannedAmount!: number;

  @ApiProperty({
    description: "已回金额。"
  })
  receivedAmount!: number;

  @ApiProperty({
    description: "计划状态。",
    enum: PaymentPlanStatus
  })
  status!: PaymentPlanStatus;

  @ApiProperty({
    description: "计划日期。",
    format: "date-time"
  })
  plannedDate!: string;
}

export class PaymentRecordSummaryVo {
  @ApiProperty({
    description: "回款记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "回款金额。"
  })
  amount!: number;

  @ApiProperty({
    description: "回款时间。",
    format: "date-time"
  })
  receivedAt!: string;

  @ApiPropertyOptional({
    description: "回款说明。",
    nullable: true
  })
  note?: string | null;
}

export class RenewalReminderSummaryVo {
  @ApiProperty({
    description: "续费提醒 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "提醒标题。"
  })
  title!: string;

  @ApiProperty({
    description: "提醒时间。",
    format: "date-time"
  })
  remindAt!: string;

  @ApiProperty({
    description: "提醒状态。",
    enum: RenewalReminderStatus
  })
  status!: RenewalReminderStatus;

  @ApiPropertyOptional({
    description: "提醒说明。",
    nullable: true
  })
  note?: string | null;
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

  @ApiPropertyOptional({
    description: "报价摘要。",
    type: () => [QuoteSummaryVo]
  })
  quotes?: QuoteSummaryVo[];

  @ApiPropertyOptional({
    description: "合同摘要。",
    type: () => [ContractSummaryVo]
  })
  contracts?: ContractSummaryVo[];

  @ApiPropertyOptional({
    description: "回款计划摘要。",
    type: () => [PaymentPlanSummaryVo]
  })
  paymentPlans?: PaymentPlanSummaryVo[];

  @ApiPropertyOptional({
    description: "回款记录摘要。",
    type: () => [PaymentRecordSummaryVo]
  })
  paymentRecords?: PaymentRecordSummaryVo[];

  @ApiPropertyOptional({
    description: "续费提醒摘要。",
    type: () => [RenewalReminderSummaryVo]
  })
  renewalReminders?: RenewalReminderSummaryVo[];

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
