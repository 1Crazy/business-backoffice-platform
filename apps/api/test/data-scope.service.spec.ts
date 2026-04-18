import { DataScopeService } from "../src/common/data-scope/data-scope.service";

describe("DataScopeService", () => {
  it("resolves subtree scope to all descendant owners", async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: "dept-1" }, { id: "dept-2" }, { id: "dept-3" }]),
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: "user-1" }, { id: "user-2" }, { id: "user-3" }])
      }
    } as any;

    const service = new DataScopeService(prisma);
    const result = await service.resolveDataScope({
      id: "manager-1",
      tenantId: "tenant-default",
      username: "manager",
      displayName: "销售主管",
      departmentId: "dept-1",
      roleCodes: ["sales-manager"],
      permissions: ["lead:read"],
      dataScopes: ["DEPARTMENT_AND_SUBTREE"]
    });

    expect(result.primaryScope).toBe("DEPARTMENT_AND_SUBTREE");
    expect(result.departmentIds).toEqual(["dept-1", "dept-2", "dept-3"]);
    expect(result.ownerIds).toEqual(["user-1", "user-2", "user-3"]);
  });

  it("limits self scope to the current actor", async () => {
    const prisma = {
      userRole: {
        findMany: jest.fn().mockResolvedValue([])
      }
    } as any;

    const service = new DataScopeService(prisma);
    const result = await service.resolveDataScope({
      id: "user-1",
      tenantId: "tenant-default",
      username: "member",
      displayName: "销售成员",
      departmentId: null,
      roleCodes: ["sales-member"],
      permissions: ["customer:read"],
      dataScopes: []
    });

    expect(result.primaryScope).toBe("SELF");
    expect(result.ownerIds).toEqual(["user-1"]);
  });

  it("expands scoped access with matched customer pool tags", async () => {
    const prisma = {
      customerTag: {
        findMany: jest.fn().mockResolvedValue([{ id: "tag-1" }])
      },
      customer: {
        findMany: jest.fn().mockResolvedValue([{ ownerId: "owner-9" }])
      },
      userRole: {
        findMany: jest.fn().mockResolvedValue([])
      }
    } as any;

    const service = new DataScopeService(prisma);
    const result = await service.resolveDataScope({
      id: "user-1",
      tenantId: "tenant-default",
      username: "member",
      displayName: "销售成员",
      departmentId: null,
      roleCodes: ["sales-member"],
      permissions: ["customer:read"],
      dataScopes: [],
      extendedDataScopes: [
        {
          dimension: "CUSTOMER_POOL",
          values: ["VIP 客户池"]
        }
      ]
    });

    expect(result.primaryScope).toBe("SELF");
    expect(result.ownerIds).toEqual(["user-1", "owner-9"]);
    expect(result.customerPoolTagIds).toEqual(["tag-1"]);
  });
});
