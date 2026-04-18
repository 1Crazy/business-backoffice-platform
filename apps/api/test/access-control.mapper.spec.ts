import { mapPermission, mapRole } from "../src/common/mappers/access-control.mapper";

describe("mapPermission", () => {
  it("includes the migrated platform application code when mapping governance permissions", () => {
    const record = {
      id: "perm-1",
      appCode: "platform",
      name: "查看员工",
      code: "user:read",
      description: "测试权限",
      group: "access",
      createdAt: new Date("2026-04-01T00:00:00Z"),
      updatedAt: new Date("2026-04-02T00:00:00Z")
    };

    const vo = mapPermission(record as any);

    expect(vo.appCode).toBe("platform");
    expect(vo.name).toBe("查看员工");
    expect(vo.code).toBe("user:read");
    expect(vo.createdAt).toBe("2026-04-01T00:00:00.000Z");
  });
});

describe("mapRole", () => {
  it("maps granular policy bundles into the public role contract", () => {
    const record = {
      id: "role-1",
      name: "区域审批主管",
      code: "area-approval-manager",
      description: "负责区域审批",
      isSystem: false,
      status: "ACTIVE" as const,
      dataScope: "DEPARTMENT_AND_SUBTREE" as const,
      extendedDataScopes: [
        {
          dimension: "REGION",
          values: ["华东", "华南"],
          note: "覆盖重点区域"
        }
      ],
      fieldPermissionRules: [
        {
          resource: "customer",
          field: "phone",
          visibility: "MASKED"
        }
      ],
      actionPermissionRules: [
        {
          resource: "approval",
          action: "export",
          allowed: true
        }
      ],
      permissions: [],
      createdAt: new Date("2026-04-01T00:00:00Z"),
      updatedAt: new Date("2026-04-02T00:00:00Z")
    };

    const vo = mapRole(record as any);

    expect(vo.extendedDataScopes).toEqual([
      {
        dimension: "REGION",
        values: ["华东", "华南"],
        note: "覆盖重点区域"
      }
    ]);
    expect(vo.fieldPermissionRules).toEqual([
      {
        resource: "customer",
        field: "phone",
        visibility: "MASKED"
      }
    ]);
    expect(vo.actionPermissionRules).toEqual([
      {
        resource: "approval",
        action: "export",
        allowed: true
      }
    ]);
  });
});
