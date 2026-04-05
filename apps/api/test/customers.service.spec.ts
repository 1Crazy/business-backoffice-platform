import { CustomersService } from "../src/modules/customers/customers.service";

describe("CustomersService", () => {
  it("returns paginated customers with scoped owner filters", async () => {
    const items = [
      {
        id: "customer-2",
        name: "Beta Corp"
      }
    ];
    const prisma = {
      customer: {
        findMany: jest.fn().mockResolvedValue(items),
        count: jest.fn().mockResolvedValue(11)
      },
      $transaction: jest.fn().mockImplementation(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
    } as any;
    const dataScopeService = {
      buildScopedOwnerFilter: jest.fn().mockResolvedValue({
        ownerId: {
          in: ["user-1", "user-2"]
        }
      }),
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
    } as any;
    const service = new CustomersService(
      prisma,
      {
        create: jest.fn().mockResolvedValue(undefined)
      } as any,
      dataScopeService
    );
    const actor = {
      id: "manager-1",
      username: "manager",
      displayName: "销售主管",
      roleCodes: ["sales-manager"],
      permissions: ["customer:read"]
    };

    const result = await service.list(
      {
        page: 2,
        pageSize: 5,
        sortBy: "name",
        sortOrder: "asc",
        status: "active"
      },
      actor
    );

    expect(dataScopeService.buildScopedOwnerFilter).toHaveBeenCalledWith(actor, undefined);
    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        orderBy: [{ name: "asc" }, { id: "desc" }],
        where: expect.objectContaining({
          ownerId: {
            in: ["user-1", "user-2"]
          },
          status: "active"
        })
      })
    );
    expect(result).toMatchObject({
      items,
      page: 2,
      pageSize: 5,
      total: 11,
      totalPages: 3,
      sortBy: "name",
      sortOrder: "asc"
    });
  });

  it("checks both current and target owners when reassigning a customer", async () => {
    const prisma = {
      customer: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: "customer-1",
          ownerId: "owner-1"
        }),
        update: jest.fn().mockResolvedValue({
          id: "customer-1",
          ownerId: "owner-2"
        })
      }
    } as any;
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
    } as any;
    const service = new CustomersService(prisma, auditLogsService, dataScopeService);
    const actor = {
      id: "manager-1",
      username: "manager",
      displayName: "销售主管",
      roleCodes: ["sales-manager"],
      permissions: ["customer:assign"]
    };

    await service.reassignOwner("customer-1", { ownerId: "owner-2" }, actor);

    expect(dataScopeService.assertOwnerAccessible).toHaveBeenNthCalledWith(
      1,
      actor,
      "owner-1",
      "You do not have access to this customer."
    );
    expect(dataScopeService.assertOwnerAccessible).toHaveBeenNthCalledWith(
      2,
      actor,
      "owner-2",
      "You cannot assign customers outside your data scope."
    );
    expect(prisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          ownerId: "owner-2"
        }
      })
    );
  });
});
