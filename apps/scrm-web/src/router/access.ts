/** 路由层：负责页面导航、访问控制和首屏跳转规则。 */
export interface AccessibleRouteDefinition {
  path: string;
  permission?: string;
}

export const SCRM_ROUTE_ACCESS: AccessibleRouteDefinition[] = [
  {
    path: "/dashboard",
    permission: "dashboard:view"
  },
  {
    path: "/departments",
    permission: "department:read"
  },
  {
    path: "/customers",
    permission: "customer:read"
  },
  {
    path: "/opportunities",
    permission: "opportunity:read"
  },
  {
    path: "/revenue-operations",
    permission: "opportunity:read"
  },
  {
    path: "/leads",
    permission: "lead:read"
  },
  {
    path: "/system",
    permission: "dictionary:read"
  }
];

export function resolveFirstAccessiblePath(permissions: string[]): string | null {
  const route = SCRM_ROUTE_ACCESS.find(
    (item) => !item.permission || permissions.includes(item.permission)
  );

  return route?.path ?? null;
}
