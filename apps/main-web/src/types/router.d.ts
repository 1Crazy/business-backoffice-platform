import "vue-router";

import type { HostDomain, MicroAppName } from "@/types/navigation";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    description?: string;
    permission?: string;
    hidden?: boolean;
    sectionLabel?: string;
    kicker?: string;
    domain?: HostDomain;
    domainTitle?: string;
    domainBadge?: string;
    microAppName?: MicroAppName;
    governanceTab?: "departments" | "employees" | "roles";
  }
}
