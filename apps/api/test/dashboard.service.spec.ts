import { DashboardService } from "../src/modules/dashboard/dashboard.service";

describe("DashboardService", () => {
  it("aggregates dashboard counters and conversion rate", async () => {
    const dashboardRepository = {
      getOverviewCounts: jest.fn().mockResolvedValue({
        newCustomers: 12,
        followUpCount: 36,
        convertedLeads: 6,
        totalLeads: 20,
        pendingReminders: 4
      })
    } as any;
    const dataScopeService = {
      resolveAccessibleOwnerIds: jest.fn().mockResolvedValue(["user-1", "user-2"])
    } as any;

    const service = new DashboardService(dashboardRepository, dataScopeService);
    const result = await service.overview({}, {
      id: "admin-1",
      username: "admin",
      displayName: "管理员",
      roleCodes: ["super-admin"],
      permissions: ["dashboard:view"]
    });

    expect(result.newCustomers).toBe(12);
    expect(result.followUpCount).toBe(36);
    expect(result.conversionRate).toBe(30);
    expect(result.pendingReminders).toBe(4);
    expect(dashboardRepository.getOverviewCounts).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerFilter: {
          ownerId: {
            in: ["user-1", "user-2"]
          }
        },
        followUpScope: {
          OR: [
            {
              lead: {
                ownerId: {
                  in: ["user-1", "user-2"]
                }
              }
            },
            {
              customer: {
                ownerId: {
                  in: ["user-1", "user-2"]
                }
              }
            }
          ]
        }
      })
    );
  });
});
