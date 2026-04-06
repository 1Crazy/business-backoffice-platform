import { resolveFirstAccessiblePath } from "@/router/access";

describe("resolveFirstAccessiblePath", () => {
  it("prefers dashboard when available", () => {
    expect(resolveFirstAccessiblePath(["dashboard:view", "customer:read"])).toBe("/dashboard");
  });

  it("falls back to another permitted page", () => {
    expect(resolveFirstAccessiblePath(["customer:read"])).toBe("/customers");
  });

  it("resolves the opportunity page when only opportunity permission is granted", () => {
    expect(resolveFirstAccessiblePath(["opportunity:read"])).toBe("/opportunities");
  });

  it("returns null when no page permission is available", () => {
    expect(resolveFirstAccessiblePath([])).toBeNull();
  });
});
