import { Injectable } from "@nestjs/common";
import { PaymentPlanStatus, Prisma } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const quoteSelect = Prisma.validator<Prisma.QuoteSelect>()({
  id: true,
  quoteNo: true,
  title: true,
  amount: true,
  status: true,
  issuedAt: true,
  expiresAt: true,
  notes: true,
  customerId: true,
  opportunityId: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true
});

const contractSelect = Prisma.validator<Prisma.ContractSelect>()({
  id: true,
  contractNo: true,
  title: true,
  amount: true,
  status: true,
  startDate: true,
  endDate: true,
  signedAt: true,
  notes: true,
  customerId: true,
  opportunityId: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true
});

const paymentPlanSelect = Prisma.validator<Prisma.PaymentPlanSelect>()({
  id: true,
  title: true,
  plannedAmount: true,
  receivedAmount: true,
  status: true,
  plannedDate: true,
  notes: true,
  customerId: true,
  opportunityId: true,
  contractId: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true
});

const paymentRecordSelect = Prisma.validator<Prisma.PaymentRecordSelect>()({
  id: true,
  amount: true,
  receivedAt: true,
  note: true,
  customerId: true,
  opportunityId: true,
  contractId: true,
  paymentPlanId: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true
});

const renewalReminderSelect = Prisma.validator<Prisma.RenewalReminderSelect>()({
  id: true,
  title: true,
  remindAt: true,
  status: true,
  note: true,
  customerId: true,
  opportunityId: true,
  contractId: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true
});

const opportunityOverviewInclude = Prisma.validator<Prisma.OpportunityInclude>()({
  quotes: {
    select: quoteSelect,
    orderBy: {
      createdAt: "desc"
    }
  },
  contracts: {
    select: contractSelect,
    orderBy: {
      createdAt: "desc"
    }
  },
  paymentPlans: {
    select: paymentPlanSelect,
    orderBy: {
      plannedDate: "asc"
    }
  },
  paymentRecords: {
    select: paymentRecordSelect,
    orderBy: {
      receivedAt: "desc"
    }
  },
  renewalReminders: {
    select: renewalReminderSelect,
    orderBy: {
      remindAt: "asc"
    }
  }
});

const customerOverviewInclude = Prisma.validator<Prisma.CustomerInclude>()({
  quotes: {
    select: quoteSelect,
    orderBy: {
      createdAt: "desc"
    }
  },
  contracts: {
    select: contractSelect,
    orderBy: {
      createdAt: "desc"
    }
  },
  paymentPlans: {
    select: paymentPlanSelect,
    orderBy: {
      plannedDate: "asc"
    }
  },
  paymentRecords: {
    select: paymentRecordSelect,
    orderBy: {
      receivedAt: "desc"
    }
  },
  renewalReminders: {
    select: renewalReminderSelect,
    orderBy: {
      remindAt: "asc"
    }
  }
});

export type QuoteRecord = Prisma.QuoteGetPayload<{ select: typeof quoteSelect }>;
export type ContractRecord = Prisma.ContractGetPayload<{ select: typeof contractSelect }>;
export type PaymentPlanRecord = Prisma.PaymentPlanGetPayload<{ select: typeof paymentPlanSelect }>;
export type PaymentRecordRecord = Prisma.PaymentRecordGetPayload<{ select: typeof paymentRecordSelect }>;
export type RenewalReminderRecord = Prisma.RenewalReminderGetPayload<{ select: typeof renewalReminderSelect }>;

export type OpportunityRevenueOverviewRecord = Prisma.OpportunityGetPayload<{
  include: typeof opportunityOverviewInclude;
}>;

export type CustomerRevenueOverviewRecord = Prisma.CustomerGetPayload<{
  include: typeof customerOverviewInclude;
}>;

type OpportunityContextRecord = Prisma.OpportunityGetPayload<{
  select: {
    id: true;
    customerId: true;
    ownerId: true;
    stage: true;
  };
}>;

type CustomerContextRecord = Prisma.CustomerGetPayload<{
  select: {
    id: true;
    ownerId: true;
  };
}>;

type ContractContextRecord = Prisma.ContractGetPayload<{
  select: {
    id: true;
    customerId: true;
    opportunityId: true;
    ownerId: true;
  };
}>;

type PaymentPlanContextRecord = Prisma.PaymentPlanGetPayload<{
  select: {
    id: true;
    customerId: true;
    opportunityId: true;
    contractId: true;
    ownerId: true;
    plannedAmount: true;
    receivedAmount: true;
  };
}>;

@Injectable()
export class RevenueOperationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOpportunityContextById(id: string): Promise<OpportunityContextRecord> {
    return this.prisma.opportunity.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        customerId: true,
        ownerId: true,
        stage: true
      }
    });
  }

  findCustomerContextById(id: string): Promise<CustomerContextRecord> {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        ownerId: true
      }
    });
  }

  findContractContextById(id: string): Promise<ContractContextRecord> {
    return this.prisma.contract.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        customerId: true,
        opportunityId: true,
        ownerId: true
      }
    });
  }

  findPaymentPlanContextById(id: string): Promise<PaymentPlanContextRecord> {
    return this.prisma.paymentPlan.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        customerId: true,
        opportunityId: true,
        contractId: true,
        ownerId: true,
        plannedAmount: true,
        receivedAmount: true
      }
    });
  }

  findOpportunityOverview(opportunityId: string): Promise<OpportunityRevenueOverviewRecord> {
    return this.prisma.opportunity.findUniqueOrThrow({
      where: { id: opportunityId },
      include: opportunityOverviewInclude
    });
  }

  findCustomerOverview(customerId: string): Promise<CustomerRevenueOverviewRecord> {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      include: customerOverviewInclude
    });
  }

  async createQuote(input: {
    quoteNo: string;
    title: string;
    amount: Prisma.Decimal;
    issuedAt?: Date;
    expiresAt?: Date;
    notes?: string;
    customerId: string;
    opportunityId: string;
    ownerId: string;
  }) {
    const record = await this.prisma.quote.create({
      data: {
        quoteNo: input.quoteNo,
        title: input.title,
        amount: input.amount,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
        notes: input.notes,
        customerId: input.customerId,
        opportunityId: input.opportunityId,
        ownerId: input.ownerId
      },
      select: quoteSelect
    });

    return record;
  }

  async createContract(input: {
    contractNo: string;
    title: string;
    amount: Prisma.Decimal;
    startDate: Date;
    endDate: Date;
    signedAt?: Date;
    notes?: string;
    customerId: string;
    opportunityId: string;
    ownerId: string;
  }) {
    return this.prisma.contract.create({
      data: {
        contractNo: input.contractNo,
        title: input.title,
        amount: input.amount,
        startDate: input.startDate,
        endDate: input.endDate,
        signedAt: input.signedAt,
        notes: input.notes,
        customerId: input.customerId,
        opportunityId: input.opportunityId,
        ownerId: input.ownerId
      },
      select: contractSelect
    });
  }

  async createPaymentPlan(input: {
    title: string;
    plannedAmount: Prisma.Decimal;
    plannedDate: Date;
    notes?: string;
    customerId: string;
    opportunityId: string;
    contractId?: string;
    ownerId: string;
  }) {
    return this.prisma.paymentPlan.create({
      data: {
        title: input.title,
        plannedAmount: input.plannedAmount,
        plannedDate: input.plannedDate,
        notes: input.notes,
        customerId: input.customerId,
        opportunityId: input.opportunityId,
        contractId: input.contractId,
        ownerId: input.ownerId
      },
      select: paymentPlanSelect
    });
  }

  async createPaymentRecord(input: {
    amount: Prisma.Decimal;
    receivedAt: Date;
    note?: string;
    customerId: string;
    opportunityId: string;
    contractId?: string;
    paymentPlanId: string;
    ownerId: string;
    nextReceivedAmount: Prisma.Decimal;
    nextStatus: PaymentPlanStatus;
  }) {
    const { record, updatedPlan } = await this.prisma.$transaction(async (tx) => {
      const createdRecord = await tx.paymentRecord.create({
        data: {
          amount: input.amount,
          receivedAt: input.receivedAt,
          note: input.note,
          customerId: input.customerId,
          opportunityId: input.opportunityId,
          contractId: input.contractId,
          paymentPlanId: input.paymentPlanId,
          ownerId: input.ownerId
        },
        select: paymentRecordSelect
      });

      const nextPlan = await tx.paymentPlan.update({
        where: {
          id: input.paymentPlanId
        },
        data: {
          receivedAmount: input.nextReceivedAmount,
          status: input.nextStatus
        },
        select: paymentPlanSelect
      });

      return {
        record: createdRecord,
        updatedPlan: nextPlan
      };
    });

    return {
      record,
      updatedPlan
    };
  }

  async createRenewalReminder(input: {
    title: string;
    remindAt: Date;
    note?: string;
    customerId: string;
    opportunityId?: string;
    contractId: string;
    ownerId: string;
  }) {
    return this.prisma.renewalReminder.create({
      data: {
        title: input.title,
        remindAt: input.remindAt,
        note: input.note,
        customerId: input.customerId,
        opportunityId: input.opportunityId,
        contractId: input.contractId,
        ownerId: input.ownerId
      },
      select: renewalReminderSelect
    });
  }
}
