import { describe, expect, it } from "vitest";

import { visibleNavigationItems } from "@/config/navigation";
import { OA_ROUTE_ACCESS } from "../../../oa-web/src/router/access";
import { SCRM_ROUTE_ACCESS } from "../../../scrm-web/src/router/access";

function stripMicroPrefix(path: string): string {
  return path.replace(/^\/(oa|scrm)/, "") || "/";
}

describe("host and micro-app navigation contract", () => {
  it("keeps OA host entries aligned with OA route access rules", () => {
    const oaAccessByPath = new Map(OA_ROUTE_ACCESS.map((item) => [item.path, item]));
    const oaHostItems = visibleNavigationItems.filter((item) => item.microAppName === "oa-web");

    expect(oaHostItems.length).toBeGreaterThan(0);

    for (const hostItem of oaHostItems) {
      const routeAccess = oaAccessByPath.get(stripMicroPrefix(hostItem.path));

      expect(routeAccess, `${hostItem.path} should exist in oa-web route access`).toBeDefined();
      expect(routeAccess?.permission).toBe(hostItem.permission);
    }
  });

  it("keeps SCRM host entries aligned with SCRM route access rules", () => {
    const scrmAccessByPath = new Map(SCRM_ROUTE_ACCESS.map((item) => [item.path, item]));
    const scrmHostItems = visibleNavigationItems.filter((item) => item.microAppName === "scrm-web");

    expect(scrmHostItems.length).toBeGreaterThan(0);

    for (const hostItem of scrmHostItems) {
      const routeAccess = scrmAccessByPath.get(stripMicroPrefix(hostItem.path));

      expect(routeAccess, `${hostItem.path} should exist in scrm-web route access`).toBeDefined();
      expect(routeAccess?.permission).toBe(hostItem.permission);
    }
  });
});
