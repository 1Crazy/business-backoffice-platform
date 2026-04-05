import { CustomersService } from "../src/modules/customers/customers.service";

function buildCustomerRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "customer-1",
    name: "Beta Corp",
    contactName: "王强",
    phone: "13800000000",
    email: "beta@example.com",
    source: "website",
    status: "active",
    notes: "重点客户",
    ownerId: "owner-1",
    owner: {
      id: "owner-1",
      username: "sales",
      displayName: "销售甲",
      email: "sales@example.com",
      phone: "13900000000",
      status: "ACTIVE",
      departmentId: "dept-1"
    },
    tags: [
      {
        tag: {
          id: "tag-1",
          name: "VIP",
          color: "#f59e0b"
        }
      }
    ],
    attachments: [],
    createdAt: new Date("2026-04-05T08:00:00.000Z"),
    updatedAt: new Date("2026-04-05T09:00:00.000Z"),
    ...overrides
  } as any;
}

describe("CustomersService", () => {
  it("returns paginated customers with scoped owner filters", async () => {
    const customersRepository = {
      list: jest.fn().mockResolvedValue({
        items: [buildCustomerRecord()],
        total: 11
      })
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
      customersRepository,
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
    expect(customersRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: {
          in: ["user-1", "user-2"]
        },
        status: "active"
      }),
      [{ name: "asc" }, { id: "desc" }],
      {
        page: 2,
        pageSize: 5,
        skip: 5,
        take: 5
      }
    );
    expect(result).toMatchObject({
      items: [
        expect.objectContaining({
          id: "customer-1",
          owner: expect.objectContaining({
            displayName: "销售甲"
          }),
          createdAt: "2026-04-05T08:00:00.000Z"
        })
      ],
      page: 2,
      pageSize: 5,
      total: 11,
      totalPages: 3,
      sortBy: "name",
      sortOrder: "asc"
    });
  });

  it("checks both current and target owners when reassigning a customer", async () => {
    const customersRepository = {
      findOwnerById: jest.fn().mockResolvedValue({
        ownerId: "owner-1"
      }),
      updateOwner: jest.fn().mockResolvedValue(
        buildCustomerRecord({
          ownerId: "owner-2",
          owner: {
            id: "owner-2",
            username: "sales-2",
            displayName: "销售乙",
            email: null,
            phone: null,
            status: "ACTIVE",
            departmentId: "dept-2"
          }
        })
      )
    } as any;
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
    } as any;
    const service = new CustomersService(customersRepository, auditLogsService, dataScopeService);
    const actor = {
      id: "manager-1",
      username: "manager",
      displayName: "销售主管",
      roleCodes: ["sales-manager"],
      permissions: ["customer:assign"]
    };

    const result = await service.reassignOwner("customer-1", { ownerId: "owner-2" }, actor);

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
    expect(customersRepository.updateOwner).toHaveBeenCalledWith("customer-1", "owner-2");
    expect(result).toMatchObject({
      ownerId: "owner-2",
      owner: {
        displayName: "销售乙"
      }
    });
  });
});
