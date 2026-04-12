import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ContractStatus, PaymentPlanStatus, QuoteStatus, RenewalReminderStatus } from "@prisma/client";

export class QuoteVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quoteNo!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty({
    enum: QuoteStatus
  })
  status!: QuoteStatus;

  @ApiPropertyOptional({
    nullable: true
  })
  issuedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  expiresAt?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  notes?: string | null;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  opportunityId!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ContractVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  contractNo!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty({
    enum: ContractStatus
  })
  status!: ContractStatus;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  signedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  notes?: string | null;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  opportunityId!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaymentPlanVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  plannedAmount!: number;

  @ApiProperty()
  receivedAmount!: number;

  @ApiProperty({
    enum: PaymentPlanStatus
  })
  status!: PaymentPlanStatus;

  @ApiProperty()
  plannedDate!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  notes?: string | null;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  opportunityId!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  contractId?: string | null;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaymentRecordVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  receivedAt!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  note?: string | null;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  opportunityId!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  contractId?: string | null;

  @ApiProperty()
  paymentPlanId!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class RenewalReminderVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  remindAt!: string;

  @ApiProperty({
    enum: RenewalReminderStatus
  })
  status!: RenewalReminderStatus;

  @ApiPropertyOptional({
    nullable: true
  })
  note?: string | null;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  opportunityId?: string | null;

  @ApiProperty()
  contractId!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class OpportunityRevenueOverviewVo {
  @ApiProperty()
  opportunityId!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty({
    type: () => [QuoteVo]
  })
  quotes!: QuoteVo[];

  @ApiProperty({
    type: () => [ContractVo]
  })
  contracts!: ContractVo[];

  @ApiProperty({
    type: () => [PaymentPlanVo]
  })
  paymentPlans!: PaymentPlanVo[];

  @ApiProperty({
    type: () => [PaymentRecordVo]
  })
  paymentRecords!: PaymentRecordVo[];

  @ApiProperty({
    type: () => [RenewalReminderVo]
  })
  renewalReminders!: RenewalReminderVo[];
}

export class CustomerRevenueOverviewVo {
  @ApiProperty()
  customerId!: string;

  @ApiProperty({
    type: () => [QuoteVo]
  })
  quotes!: QuoteVo[];

  @ApiProperty({
    type: () => [ContractVo]
  })
  contracts!: ContractVo[];

  @ApiProperty({
    type: () => [PaymentPlanVo]
  })
  paymentPlans!: PaymentPlanVo[];

  @ApiProperty({
    type: () => [PaymentRecordVo]
  })
  paymentRecords!: PaymentRecordVo[];

  @ApiProperty({
    type: () => [RenewalReminderVo]
  })
  renewalReminders!: RenewalReminderVo[];
}
