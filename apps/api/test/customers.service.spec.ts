import { CustomersService } from "../src/modules/customers/customers.service";
import { AccessPolicyService } from "../src/common/access-policy/access-policy.service";

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
      list: vi.fn().mockResolvedValue({
        items: [buildCustomerRecord()],
        total: 11
      })
    } as any;
    const dataScopeService = {
      buildScopedCustomerFilter: vi.fn().mockResolvedValue({
        ownerId: {
          in: ["user-1", "user-2"]
        }
      }),
      assertOwnerAccessible: vi.fn().mockResolvedValue(undefined)
    } as any;
    const accessPolicyService = {
      sanitizeReadFields: vi.fn().mockImplementation((_actor, _resource, payload) => payload),
      assertWritableFields: vi.fn()
    } as any;
    const notificationCenterService = {
      publishEvent: vi.fn().mockResolvedValue(undefined)
    } as any;
    const service = new CustomersService(
      customersRepository,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      dataScopeService,
      accessPolicyService,
      notificationCenterService
    );
    const actor = {
      id: "manager-1",
      tenantId: "tenant-default",
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

    expect(dataScopeService.buildScopedCustomerFilter).toHaveBeenCalledWith(actor, undefined);
    expect(customersRepository.list).toHaveBeenCalledWith(
      "tenant-default",
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
      findOwnerById: vi.fn().mockResolvedValue({
        ownerId: "owner-1"
      }),
      updateOwner: vi.fn().mockResolvedValue(
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
      create: vi.fn().mockResolvedValue(undefined)
    } as any;
    const dataScopeService = {
      buildScopedCustomerFilter: vi.fn(),
      assertCustomerAccessible: vi.fn().mockResolvedValue(undefined),
      assertOwnerAccessible: vi.fn().mockResolvedValue(undefined)
    } as any;
    const accessPolicyService = {
      sanitizeReadFields: vi.fn().mockImplementation((_actor, _resource, payload) => payload),
      assertWritableFields: vi.fn()
    } as any;
    const service = new CustomersService(
      customersRepository,
      auditLogsService,
      dataScopeService,
      accessPolicyService,
      {
        publishEvent: vi.fn().mockResolvedValue(undefined)
      } as any
    );
    const actor = {
      id: "manager-1",
      tenantId: "tenant-default",
      username: "manager",
      displayName: "销售主管",
      roleCodes: ["sales-manager"],
      permissions: ["customer:assign"]
    };

    const result = await service.reassignOwner("customer-1", { ownerId: "owner-2" }, actor);

    expect(dataScopeService.assertCustomerAccessible).toHaveBeenNthCalledWith(
      1,
      actor,
      "customer-1",
      "You do not have access to this customer."
    );
    expect(dataScopeService.assertOwnerAccessible).toHaveBeenNthCalledWith(
      1,
      actor,
      "owner-2",
      "You cannot assign customers outside your data scope."
    );
    expect(customersRepository.findOwnerById).toHaveBeenCalledWith("customer-1", "tenant-default");
    expect(customersRepository.updateOwner).toHaveBeenCalledWith("customer-1", "tenant-default", "owner-2");
    expect(result).toMatchObject({
      ownerId: "owner-2",
      owner: {
        displayName: "销售乙"
      }
    });
  });

  it("applies default pii masking for customer responses without explicit field rules", async () => {
    const customersRepository = {
      findDetailById: vi.fn().mockResolvedValue(buildCustomerRecord())
    } as any;
    const service = new CustomersService(
      customersRepository,
      {
        create: vi.fn().mockResolvedValue(undefined)
      } as any,
      {
        assertCustomerAccessible: vi.fn().mockResolvedValue(undefined)
      } as any,
      new AccessPolicyService(),
      {
        publishEvent: vi.fn().mockResolvedValue(undefined)
      } as any
    );

    const result = await service.detail("customer-1", {
      id: "manager-1",
      tenantId: "tenant-default",
      username: "manager",
      displayName: "销售主管",
      roleCodes: ["sales-manager"],
      permissions: ["customer:read"]
    } as any);

    expect(result).toMatchObject({
      contactName: "**",
      phone: "138****0000",
      email: "b***@example.com"
    });
  });
});
