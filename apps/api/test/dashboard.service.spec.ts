import { DashboardService } from "../src/modules/dashboard/dashboard.service";

describe("DashboardService", () => {
  it("aggregates upgraded dashboard metrics and honors owner filters", async () => {
    const dashboardRepository = {
      listScopeOptions: vi.fn().mockResolvedValue({
        departments: [
          { id: "dept-1", name: "华东团队" },
          { id: "dept-2", name: "华南团队" }
        ],
        owners: [
          {
            id: "user-1",
            displayName: "Alice",
            departmentId: "dept-1",
            departmentName: "华东团队"
          },
          {
            id: "user-2",
            displayName: "Bob",
            departmentId: "dept-2",
            departmentName: "华南团队"
          }
        ]
      }),
      getOverviewCounts: vi.fn().mockResolvedValue({
        newCustomers: 12,
        followUpCount: 36,
        convertedLeads: 6,
        totalLeads: 20,
        pendingReminders: 4,
        newOpportunities: 9,
        pipelineForecastAmount: 188000,
        wonOpportunities: 5,
        wonAmount: 132000,
        lostOpportunities: 3
      }),
      getFunnelBreakdown: vi.fn().mockResolvedValue({
        totalLeads: 20,
        convertedLeads: 6,
        stages: [
          {
            stage: "DISCOVERY",
            count: 4,
            amount: 80000
          },
          {
            stage: "CLOSED_WON",
            count: 5,
            amount: 132000
          }
        ]
      }),
      getOwnerPerformanceSnapshot: vi.fn().mockResolvedValue([
        {
          ownerId: "user-1",
          wonAmount: 132000,
          receivedAmount: 98000,
          newCustomers: 12,
          wonOpportunities: 5
        }
      ]),
      findPaymentPlansForForecast: vi.fn().mockResolvedValue([
        {
          plannedAmount: 160000,
          receivedAmount: 98000,
          plannedDate: new Date("2026-04-05T00:00:00.000Z"),
          status: "PARTIAL"
        }
      ]),
      getApprovalTimeliness: vi.fn().mockResolvedValue({
        completedLeaveRequests: [
          {
            createdAt: new Date("2026-04-01T00:00:00.000Z"),
            updatedAt: new Date("2026-04-01T08:00:00.000Z")
          }
        ],
        completedAdministrativeRequests: [
          {
            submittedAt: new Date("2026-04-02T00:00:00.000Z"),
            decidedAt: new Date("2026-04-02T10:00:00.000Z"),
            updatedAt: new Date("2026-04-02T10:00:00.000Z")
          }
        ],
        pendingOver48Hours: 2
      })
    } as any;
    const dataScopeService = {
      resolveDataScope: vi.fn().mockResolvedValue({
        primaryScope: "DEPARTMENT",
        scopes: ["DEPARTMENT"],
        isGlobal: false,
        departmentIds: ["dept-1", "dept-2"],
        ownerIds: ["user-1", "user-2"]
      })
    } as any;

    const service = new DashboardService(dashboardRepository, dataScopeService);
    const result = await service.overview(
      {
        departmentId: "dept-1",
        ownerId: "user-1"
      },
      {
      id: "admin-1",
      username: "admin",
      displayName: "管理员",
      roleCodes: ["super-admin"],
      permissions: ["dashboard:view"]
      }
    );

    expect(result.newCustomers).toBe(12);
    expect(result.followUpCount).toBe(36);
    expect(result.conversionRate).toBe(30);
    expect(result.pendingReminders).toBe(4);
    expect(result.newOpportunities).toBe(9);
    expect(result.pipelineForecastAmount).toBe(188000);
    expect(result.wonOpportunities).toBe(5);
    expect(result.wonAmount).toBe(132000);
    expect(result.opportunityWinRate).toBe(62.5);
    expect(result.departmentId).toBe("dept-1");
    expect(result.ownerId).toBe("user-1");
    expect(result.salesFunnel[0].label).toBe("线索池");
    expect(result.ownerPerformanceRanking[0].label).toBe("Alice");
    expect(result.departmentPerformanceRanking[0].label).toBe("华东团队");
    expect(result.receivableForecast.unreceivedAmount).toBe(62000);
    expect(result.approvalTimeliness.averageHours).toBe(9);
    expect(dashboardRepository.getOverviewCounts).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerIds: ["user-1"]
      })
    );
  });
});
