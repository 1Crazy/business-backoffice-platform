import { describe, expect, it } from "vitest";

import { resolveFirstAccessiblePath } from "@/router/access";

describe("resolveFirstAccessiblePath", () => {
  it("prefers platform governance pages when governance permission is granted", () => {
    expect(resolveFirstAccessiblePath(["department:read", "oa:workspace:view"])).toBe("/platform/organization/departments");
  });

  it("falls back to OA pages when no platform governance permission is available", () => {
    expect(resolveFirstAccessiblePath(["oa:workspace:view"])).toBe("/oa/workspace");
  });

  it("returns null when no page permission is available", () => {
    expect(resolveFirstAccessiblePath([])).toBeNull();
  });
});
