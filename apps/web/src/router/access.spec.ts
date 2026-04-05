import { resolveFirstAccessiblePath } from "./access";

describe("resolveFirstAccessiblePath", () => {
  it("prefers dashboard when available", () => {
    expect(resolveFirstAccessiblePath(["dashboard:view", "customer:read"])).toBe("/dashboard");
  });

  it("falls back to another permitted page", () => {
    expect(resolveFirstAccessiblePath(["customer:read"])).toBe("/customers");
  });

  it("returns null when no page permission is available", () => {
    expect(resolveFirstAccessiblePath([])).toBeNull();
  });
});
