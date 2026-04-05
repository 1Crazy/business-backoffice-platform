import { DashboardService } from "../src/modules/dashboard/dashboard.service";

describe("DashboardService", () => {
  it("aggregates dashboard counters and conversion rate", async () => {
    const prisma = {
      customer: {
        count: jest.fn().mockResolvedValue(12)
      },
      followUp: {
        count: jest.fn().mockResolvedValue(36)
      },
      lead: {
        count: jest
          .fn()
          .mockResolvedValueOnce(6)
          .mockResolvedValueOnce(20)
      },
      reminder: {
        count: jest.fn().mockResolvedValue(4)
      }
    } as any;
    const dataScopeService = {
      resolveAccessibleOwnerIds: jest.fn().mockResolvedValue(["user-1", "user-2"])
    } as any;

    const service = new DashboardService(prisma, dataScopeService);
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
    expect(prisma.customer.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerId: {
            in: ["user-1", "user-2"]
          }
        })
      })
    );
    expect(prisma.followUp.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
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
        })
      })
    );
    expect(prisma.reminder.count).toHaveBeenCalledWith({
      where: {
        ownerId: {
          in: ["user-1", "user-2"]
        },
        status: "PENDING"
      }
    });
  });
});
