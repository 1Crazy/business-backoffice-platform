/** 路由访问规则：负责定义 OA 应用内的页面入口与权限对应关系。 */
interface PageAccessRule {
  path: string;
  permission?: string;
}

const OA_ROUTE_ACCESS: PageAccessRule[] = [
  {
    path: "/workspace",
    permission: "oa:workspace:view"
  },
  {
    path: "/approvals/pending",
    permission: "oa:approval:read"
  },
  {
    path: "/approvals/mine",
    permission: "oa:request:apply"
  },
  {
    path: "/administrative-requests/new",
    permission: "oa:request:apply"
  },
  {
    path: "/administrative-requests/mine",
    permission: "oa:request:apply"
  },
  {
    path: "/administrative-requests/pending",
    permission: "oa:request:approve"
  },
  {
    path: "/administrative-requests/search",
    permission: "oa:request:read"
  },
  {
    path: "/leave/request",
    permission: "oa:leave:apply"
  },
  {
    path: "/announcements",
    permission: "oa:announcement:read"
  },
  {
    path: "/directory",
    permission: "oa:directory:read"
  }
];

export function resolveFirstAccessiblePath(permissions: string[]): string | null {
  return OA_ROUTE_ACCESS.find((item) => !item.permission || permissions.includes(item.permission))?.path ?? null;
}
