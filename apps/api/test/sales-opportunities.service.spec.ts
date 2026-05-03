import { BadRequestException, ForbiddenException } from "@nestjs/common";

import { SalesOpportunitiesService } from "../src/modules/sales-opportunities/sales-opportunities.service";

describe("SalesOpportunitiesService", () => {
  it("rejects creating an opportunity when the linked customer is outside scope", async () => {
    const salesOpportunitiesRepository = {
      findLeadScopeById: vi.fn()
    } as any;
    const dataScopeService = {
      buildScopedOpportunityFilter: vi.fn(),
      assertCustomerAccessible: vi.fn().mockRejectedValue(new ForbiddenException("out of scope")),
      assertOwnerAccessible: vi.fn().mockRejectedValue(new ForbiddenException("out of scope"))
    } as any;
    const accessPolicyService = {
      sanitizeReadFields: vi.fn().mockImplementation((_actor, _resource, payload) => payload),
      assertWritableFields: vi.fn()
    } as any;

    const service = new SalesOpportunitiesService(
      salesOpportunitiesRepository,
      {
        create: vi.fn()
      } as any,
      dataScopeService,
      accessPolicyService
    );

    await expect(
      service.create(
        {
          name: "Acme 年度框架合作",
          customerId: "customer-1",
          ownerId: "user-1",
          expectedAmount: 120000,
          expectedCloseDate: "2026-04-30T10:00:00.000Z",
          nextAction: "下周确认预算"
        },
        {
          id: "user-1",
          tenantId: "tenant-default",
          tenantCode: "default",
          username: "sales",
          displayName: "销售",
          roleCodes: ["sales-member"],
          permissions: ["opportunity:write"]
        }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(dataScopeService.assertCustomerAccessible).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: ["opportunity:write"] }),
      "customer-1",
      "You do not have access to the linked customer."
    );
  });

  it("prevents stage actions after the opportunity is closed", async () => {
    const salesOpportunitiesRepository = {
      findSnapshotById: vi.fn().mockResolvedValue({
        id: "opportunity-1",
        ownerId: "user-1",
        customerId: "customer-1",
        sourceLeadId: null,
        stage: "CLOSED_WON",
        expectedAmount: { toString: () => "120000" },
        expectedCloseDate: new Date("2026-04-30T10:00:00.000Z"),
        closedAt: new Date("2026-04-28T10:00:00.000Z"),
        lostReason: null
      })
    } as any;
    const dataScopeService = {
      buildScopedOpportunityFilter: vi.fn(),
      assertOpportunityAccessible: vi.fn().mockResolvedValue(undefined),
      assertCustomerAccessible: vi.fn().mockResolvedValue(undefined),
      assertOwnerAccessible: vi.fn().mockResolvedValue(undefined)
    } as any;
    const accessPolicyService = {
      sanitizeReadFields: vi.fn().mockImplementation((_actor, _resource, payload) => payload),
      assertWritableFields: vi.fn()
    } as any;

    const service = new SalesOpportunitiesService(
      salesOpportunitiesRepository,
      {
        create: vi.fn()
      } as any,
      dataScopeService,
      accessPolicyService
    );

    await expect(
      service.updateStage(
        "opportunity-1",
        {
          stage: "NEGOTIATION",
          comment: "补充一轮商务沟通"
        },
        {
          id: "user-1",
          tenantId: "tenant-default",
          tenantCode: "default",
          username: "sales",
          displayName: "销售",
          roleCodes: ["sales-member"],
          permissions: ["opportunity:write"]
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("marks an in-progress opportunity as won and records the close transition", async () => {
    const salesOpportunitiesRepository = {
      findSnapshotById: vi.fn().mockResolvedValue({
        id: "opportunity-1",
        ownerId: "user-1",
        customerId: "customer-1",
        sourceLeadId: null,
        stage: "NEGOTIATION",
        expectedAmount: { toString: () => "120000" },
        expectedCloseDate: new Date("2026-04-30T10:00:00.000Z"),
        closedAt: null,
        lostReason: null
      }),
      changeStage: vi.fn().mockResolvedValue({
        id: "opportunity-1",
        name: "Acme 年度框架合作",
        customerId: "customer-1",
        sourceLeadId: null,
        ownerId: "user-1",
        stage: "CLOSED_WON",
        expectedAmount: { toString: () => "120000" },
        expectedCloseDate: new Date("2026-04-30T10:00:00.000Z"),
        nextAction: "同步合同流程",
        notes: null,
        closedAt: new Date("2026-04-28T10:00:00.000Z"),
        lostReason: null,
        createdAt: new Date("2026-04-05T10:00:00.000Z"),
        updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        customer: {
          id: "customer-1",
          name: "Acme",
          contactName: "王强",
          phone: "13800000000"
        },
        sourceLead: null,
        owner: {
          id: "user-1",
          username: "sales",
          displayName: "销售",
          email: null,
          phone: null,
          status: "ACTIVE",
          departmentId: "dept-1"
        },
        stageHistory: []
      })
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const dataScopeService = {
      buildScopedOpportunityFilter: vi.fn(),
      assertOpportunityAccessible: vi.fn().mockResolvedValue(undefined),
      assertCustomerAccessible: vi.fn().mockResolvedValue(undefined),
      assertOwnerAccessible: vi.fn().mockResolvedValue(undefined)
    } as any;
    const accessPolicyService = {
      sanitizeReadFields: vi.fn().mockImplementation((_actor, _resource, payload) => payload),
      assertWritableFields: vi.fn()
    } as any;

    const service = new SalesOpportunitiesService(
      salesOpportunitiesRepository,
      auditLogsService,
      dataScopeService,
      accessPolicyService
    );

    const result = await service.markWon(
      "opportunity-1",
      {
        comment: "客户确认立项"
      },
      {
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "sales",
        displayName: "销售",
        roleCodes: ["sales-member"],
        permissions: ["opportunity:write"]
      }
    );

    expect(salesOpportunitiesRepository.changeStage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "opportunity-1",
        fromStage: "NEGOTIATION",
        toStage: "CLOSED_WON",
        comment: "客户确认立项"
      })
    );
    expect(result.resultStatus).toBe("WON");
    expect(auditLogsService.create).toHaveBeenCalled();
  });

  it("marks an in-progress opportunity as lost and keeps the lost reason", async () => {
    const salesOpportunitiesRepository = {
      findSnapshotById: vi.fn().mockResolvedValue({
        id: "opportunity-1",
        ownerId: "user-1",
        customerId: "customer-1",
        sourceLeadId: null,
        stage: "PROPOSAL",
        expectedAmount: { toString: () => "86000" },
        expectedCloseDate: new Date("2026-04-30T10:00:00.000Z"),
        closedAt: null,
        lostReason: null
      }),
      changeStage: vi.fn().mockResolvedValue({
        id: "opportunity-1",
        name: "Acme 年度框架合作",
        customerId: "customer-1",
        sourceLeadId: null,
        ownerId: "user-1",
        stage: "CLOSED_LOST",
        expectedAmount: { toString: () => "86000" },
        expectedCloseDate: new Date("2026-04-30T10:00:00.000Z"),
        nextAction: "收敛竞品原因",
        notes: null,
        closedAt: new Date("2026-04-28T10:00:00.000Z"),
        lostReason: "客户预算冻结",
        createdAt: new Date("2026-04-05T10:00:00.000Z"),
        updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        customer: {
          id: "customer-1",
          name: "Acme",
          contactName: "王强",
          phone: "13800000000"
        },
        sourceLead: null,
        owner: {
          id: "user-1",
          username: "sales",
          displayName: "销售",
          email: null,
          phone: null,
          status: "ACTIVE",
          departmentId: "dept-1"
        },
        stageHistory: []
      })
    } as any;
    const auditLogsService = {
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const dataScopeService = {
      buildScopedOpportunityFilter: vi.fn(),
      assertOpportunityAccessible: vi.fn().mockResolvedValue(undefined),
      assertCustomerAccessible: vi.fn().mockResolvedValue(undefined),
      assertOwnerAccessible: vi.fn().mockResolvedValue(undefined)
    } as any;
    const accessPolicyService = {
      sanitizeReadFields: vi.fn().mockImplementation((_actor, _resource, payload) => payload),
      assertWritableFields: vi.fn()
    } as any;

    const service = new SalesOpportunitiesService(
      salesOpportunitiesRepository,
      auditLogsService,
      dataScopeService,
      accessPolicyService
    );

    const result = await service.markLost(
      "opportunity-1",
      {
        lostReason: "客户预算冻结",
        comment: "延后到下季度再尝试"
      },
      {
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "sales",
        displayName: "销售",
        roleCodes: ["sales-member"],
        permissions: ["opportunity:write"]
      }
    );

    expect(salesOpportunitiesRepository.changeStage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "opportunity-1",
        fromStage: "PROPOSAL",
        toStage: "CLOSED_LOST",
        lostReason: "客户预算冻结"
      })
    );
    expect(result.resultStatus).toBe("LOST");
    expect(result.lostReason).toBe("客户预算冻结");
    expect(auditLogsService.create).toHaveBeenCalled();
  });
});
