import { mapPermission } from "../src/common/mappers/access-control.mapper";

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
