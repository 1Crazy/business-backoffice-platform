import { mapPermission } from "../src/common/mappers/access-control.mapper";

describe("mapPermission", () => {
  it("includes the application code when mapping permissions", () => {
    const record = {
      id: "perm-1",
      appCode: "oa",
      name: "查看 OA 工作台",
      code: "oa:workspace:view",
      description: "测试权限",
      group: "workspace",
      createdAt: new Date("2026-04-01T00:00:00Z"),
      updatedAt: new Date("2026-04-02T00:00:00Z")
    };

    const vo = mapPermission(record as any);

    expect(vo.appCode).toBe("oa");
    expect(vo.name).toBe("查看 OA 工作台");
    expect(vo.code).toBe("oa:workspace:view");
    expect(vo.createdAt).toBe("2026-04-01T00:00:00.000Z");
  });
});
