import { describe, expect, it } from "vitest";

import { resolveFirstAccessiblePath } from "./access";

describe("resolveFirstAccessiblePath", () => {
  it("returns the earliest accessible path when permissions are granted", () => {
    const permissions = ["oa:workspace:view", "oa:announcement:read"];
    expect(resolveFirstAccessiblePath(permissions)).toBe("/workspace");
  });

  it("falls back to the first matching entry when earlier permissions are missing", () => {
    const permissions = ["oa:announcement:read"];
    expect(resolveFirstAccessiblePath(permissions)).toBe("/announcements");
  });

  it("returns null when no configured permission matches", () => {
    const permissions: string[] = [];
    expect(resolveFirstAccessiblePath(permissions)).toBeNull();
  });
});
