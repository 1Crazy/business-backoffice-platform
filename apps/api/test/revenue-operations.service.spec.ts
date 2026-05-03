import { OpportunityStage, PaymentPlanStatus, RenewalReminderStatus } from "@prisma/client";

import { RevenueOperationsService } from "../src/modules/revenue-operations/revenue-operations.service";

describe("RevenueOperationsService", () => {
  const mockRepository = {
    findOpportunityContextById: vi.fn(),
    findCustomerOverview: vi.fn(),
    findOpportunityOverview: vi.fn(),
    findContractContextById: vi.fn(),
    findPaymentPlanContextById: vi.fn(),
    createQuote: vi.fn(),
    createContract: vi.fn(),
    createPaymentPlan: vi.fn(),
    createPaymentRecord: vi.fn(),
    createRenewalReminder: vi.fn()
  };
  const mockDataScope = {
    assertCustomerAccessible: vi.fn(),
    assertOpportunityAccessible: vi.fn()
  };
  const mockAuditLogs = {
    create: vi.fn()
  };
  const mockAccessPolicy = {
    sanitizeReadFields: vi.fn().mockImplementation((_actor, _resource, payload) => payload),
    assertWritableFields: vi.fn()
  };
  const mockNotificationCenter = {
    publishEvent: vi.fn().mockResolvedValue(undefined)
  };
  const mockOpenIntegration = {
    dispatchBusinessWebhookEvent: vi.fn().mockResolvedValue(undefined)
  };

  const defaultActor = {
    id: "user-1",
    tenantId: "tenant-default",
    tenantCode: "default",
    username: "alice",
    displayName: "Alice",
    roleCodes: ["sales-manager"],
    permissions: ["opportunity:write"]
  };

  const service = new RevenueOperationsService(
    mockRepository as any,
    mockDataScope as any,
    mockAuditLogs as any,
    mockAccessPolicy as any,
    mockNotificationCenter as any,
    mockOpenIntegration as any
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockDataScope.assertCustomerAccessible.mockResolvedValue(undefined);
    mockDataScope.assertOpportunityAccessible.mockResolvedValue(undefined);
  });

  it("creates a quote under a won opportunity", async () => {
    mockRepository.findOpportunityContextById.mockResolvedValue({
      id: "opportunity-1",
      customerId: "customer-1",
      ownerId: "owner-1",
      stage: OpportunityStage.CLOSED_WON
    });
    mockRepository.createQuote.mockResolvedValue({
      id: "quote-1",
      quoteNo: "Q-20260411-ABC123",
      title: "Acme 年度报价",
      amount: { toString: () => "320000" },
      status: "DRAFT",
      issuedAt: new Date("2026-04-11T10:00:00.000Z"),
      expiresAt: null,
      notes: null,
      customerId: "customer-1",
      opportunityId: "opportunity-1",
      ownerId: "owner-1",
      createdAt: new Date("2026-04-11T10:00:00.000Z"),
      updatedAt: new Date("2026-04-11T10:00:00.000Z")
    });

    const result = await service.createQuote(
      {
        opportunityId: "opportunity-1",
        customerId: "customer-1",
        title: "Acme 年度报价",
        amount: 320000
      },
      defaultActor
    );

    expect(mockRepository.findOpportunityContextById).toHaveBeenCalledWith("opportunity-1", "tenant-default");
    expect(mockRepository.createQuote).toHaveBeenCalled();
    expect(mockAuditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "revenue-quote",
        targetId: "quote-1"
      })
    );
    expect(result.opportunityId).toBe("opportunity-1");
  });

  it("records a payment and updates the linked payment plan status", async () => {
    mockRepository.findPaymentPlanContextById.mockResolvedValue({
      id: "payment-plan-1",
      customerId: "customer-1",
      opportunityId: "opportunity-1",
      contractId: "contract-1",
      ownerId: "owner-1",
      plannedAmount: "100000",
      receivedAmount: "60000"
    });
    mockRepository.createPaymentRecord.mockResolvedValue({
      record: {
        id: "payment-record-1",
        amount: { toString: () => "40000" },
        receivedAt: new Date("2026-04-11T12:00:00.000Z"),
        note: "尾款到账",
        customerId: "customer-1",
        opportunityId: "opportunity-1",
        contractId: "contract-1",
        paymentPlanId: "payment-plan-1",
        ownerId: "owner-1",
        createdAt: new Date("2026-04-11T12:00:00.000Z"),
        updatedAt: new Date("2026-04-11T12:00:00.000Z")
      }
    });

    const result = await service.createPaymentRecord(
      {
        paymentPlanId: "payment-plan-1",
        amount: 40000,
        receivedAt: "2026-04-11T12:00:00.000Z",
        note: "尾款到账"
      },
      defaultActor
    );

    expect(mockRepository.createPaymentRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentPlanId: "payment-plan-1",
        nextStatus: PaymentPlanStatus.PAID
      })
    );
    expect(mockAuditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "revenue-payment-record",
        targetId: "payment-record-1"
      })
    );
    expect(mockOpenIntegration.dispatchBusinessWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-default",
        eventType: "REVENUE_PAYMENT_RECEIVED",
        sourceType: "payment-record",
        sourceId: "payment-record-1"
      })
    );
    expect(result.paymentPlanId).toBe("payment-plan-1");
  });

  it("retrieves customer overview when actor owns the data scope", async () => {
    const now = new Date("2026-04-11T12:00:00.000Z");
    mockRepository.findCustomerOverview.mockResolvedValue({
      id: "customer-1",
      ownerId: "owner-1",
      quotes: [
        {
          id: "quote-1",
          quoteNo: "Q-1",
          title: "Acme Renewal",
          amount: { toString: () => "120000" },
          status: "DRAFT",
          issuedAt: now,
          expiresAt: null,
          notes: null,
          customerId: "customer-1",
          opportunityId: "opportunity-1",
          ownerId: "owner-1",
          createdAt: now,
          updatedAt: now
        }
      ],
      contracts: [
        {
          id: "contract-1",
          contractNo: "C-1",
          title: "Enterprise Contract",
          amount: { toString: () => "240000" },
          status: "ACTIVE",
          startDate: now,
          endDate: new Date("2026-04-20T00:00:00.000Z"),
          signedAt: now,
          notes: "签订完成",
          customerId: "customer-1",
          opportunityId: "opportunity-1",
          ownerId: "owner-1",
          createdAt: now,
          updatedAt: now
        }
      ],
      paymentPlans: [
        {
          id: "plan-1",
          title: "First Installment",
          plannedAmount: { toString: () => "120000" },
          receivedAmount: { toString: () => "60000" },
          status: "PARTIAL",
          plannedDate: now,
          notes: null,
          customerId: "customer-1",
          opportunityId: "opportunity-1",
          contractId: "contract-1",
          ownerId: "owner-1",
          createdAt: now,
          updatedAt: now
        }
      ],
      paymentRecords: [
        {
          id: "record-1",
          amount: { toString: () => "60000" },
          receivedAt: now,
          note: "首付款",
          customerId: "customer-1",
          opportunityId: "opportunity-1",
          contractId: "contract-1",
          paymentPlanId: "plan-1",
          ownerId: "owner-1",
          createdAt: now,
          updatedAt: now
        }
      ],
      renewalReminders: [
        {
          id: "renewal-1",
          title: "提前提醒",
          remindAt: now,
          status: RenewalReminderStatus.PENDING,
          note: "联系客户",
          customerId: "customer-1",
          opportunityId: "opportunity-1",
          contractId: "contract-1",
          ownerId: "owner-1",
          createdAt: now,
          updatedAt: now
        }
      ]
    });

    const result = await service.getCustomerOverview("customer-1", defaultActor);

    expect(mockRepository.findCustomerOverview).toHaveBeenCalledWith("customer-1", "tenant-default");
    expect(mockDataScope.assertCustomerAccessible).toHaveBeenCalledWith(
      defaultActor,
      "customer-1",
      expect.any(String)
    );
    expect(result.customerId).toBe("customer-1");
    expect(result.quotes[0].quoteNo).toBe("Q-1");
    expect(result.contracts[0].title).toBe("Enterprise Contract");
    expect(result.paymentPlans[0].plannedAmount).toBe(120000);
    expect(result.paymentRecords[0].amount).toBe(60000);
    expect(result.renewalReminders[0].status).toBe(RenewalReminderStatus.PENDING);
  });

  it("creates a renewal reminder using contract opportunity when opportunity id missing", async () => {
    mockRepository.findContractContextById.mockResolvedValue({
      id: "contract-2",
      customerId: "customer-1",
      opportunityId: "opportunity-2",
      ownerId: "owner-1"
    });
    mockRepository.createRenewalReminder.mockResolvedValue({
      id: "renewal-2",
      title: "续费提醒",
      remindAt: new Date("2026-04-20T10:00:00.000Z"),
      status: RenewalReminderStatus.PENDING,
      note: "准备报价",
      customerId: "customer-1",
      opportunityId: "opportunity-2",
      contractId: "contract-2",
      ownerId: "owner-1",
      createdAt: new Date("2026-04-11T12:00:00.000Z"),
      updatedAt: new Date("2026-04-11T12:00:00.000Z")
    });

    const result = await service.createRenewalReminder(
      {
        customerId: "customer-1",
        contractId: "contract-2",
        title: "续费提醒",
        remindAt: "2026-04-20T10:00:00.000Z",
        note: "准备报价"
      },
      defaultActor
    );

    expect(mockRepository.findContractContextById).toHaveBeenCalledWith("contract-2", "tenant-default");
    expect(mockRepository.createRenewalReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        opportunityId: "opportunity-2"
      })
    );
    expect(result.opportunityId).toBe("opportunity-2");
    expect(mockAuditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "revenue-renewal-reminder",
        targetId: "renewal-2"
      })
    );
    expect(mockNotificationCenter.publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          eventType: "RENEWAL_REMINDER"
        }),
        recipientIds: ["owner-1"]
      })
    );
  });

  it("throws when renewal reminder request includes mismatched opportunity", async () => {
    mockRepository.findContractContextById.mockResolvedValue({
      id: "contract-3",
      customerId: "customer-1",
      opportunityId: "opportunity-3",
      ownerId: "owner-1"
    });

    await expect(
      service.createRenewalReminder(
        {
          customerId: "customer-1",
          contractId: "contract-3",
          opportunityId: "other-opportunity",
          title: "续费提醒",
          remindAt: "2026-04-20T10:00:00.000Z"
        },
        defaultActor
      )
    ).rejects.toThrow("合同与商机上下文不匹配。");

    expect(mockRepository.createRenewalReminder).not.toHaveBeenCalled();
    expect(mockAuditLogs.create).not.toHaveBeenCalled();
  });
});
