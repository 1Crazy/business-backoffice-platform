/** 主应用导航配置：集中维护可访问菜单、隐藏详情页与页面元信息，避免壳层文案散落在多个组件中。 */
import type { HostNavigationGroup, HostNavigationItem } from "@/types/navigation";

const oaItems: HostNavigationItem[] = [
  {
    key: "oa-workspace",
    title: "工作台",
    description: "查看今天的重点待办、公告摘要与快捷办公入口。",
    path: "/oa/workspace",
    permission: "oa:workspace:view",
    domain: "oa",
    domainTitle: "OA 办公",
    domainBadge: "OA",
    sectionLabel: "今日工作",
    kicker: "办公协同",
    microAppName: "oa-web",
    icon: "compass"
  },
  {
    key: "oa-approvals-pending",
    title: "待我审批",
    description: "集中处理当前账号待审批的流程事项。",
    path: "/oa/approvals/pending",
    permission: "oa:approval:read",
    domain: "oa",
    domainTitle: "OA 办公",
    domainBadge: "OA",
    sectionLabel: "流程协同",
    kicker: "审批中心",
    microAppName: "oa-web",
    icon: "checklist"
  },
  {
    key: "oa-approvals-mine",
    title: "我发起的申请",
    description: "跟踪自己发起的请假与审批进度。",
    path: "/oa/approvals/mine",
    permission: "oa:leave:apply",
    domain: "oa",
    domainTitle: "OA 办公",
    domainBadge: "OA",
    sectionLabel: "流程协同",
    kicker: "申请跟踪",
    microAppName: "oa-web",
    icon: "draft"
  },
  {
    key: "oa-leave-request",
    title: "请假申请",
    description: "发起新的请假流程并补充请假说明。",
    path: "/oa/leave/request",
    permission: "oa:leave:apply",
    domain: "oa",
    domainTitle: "OA 办公",
    domainBadge: "OA",
    sectionLabel: "假勤流程",
    kicker: "流程发起",
    microAppName: "oa-web",
    icon: "calendar"
  },
  {
    key: "oa-announcements",
    title: "公告通知",
    description: "获取近期组织通知与公告内容。",
    path: "/oa/announcements",
    permission: "oa:announcement:read",
    domain: "oa",
    domainTitle: "OA 办公",
    domainBadge: "OA",
    sectionLabel: "组织信息",
    kicker: "公告同步",
    microAppName: "oa-web",
    icon: "announcement"
  },
  {
    key: "oa-directory",
    title: "组织通讯录",
    description: "按部门查询联系人与协作对象。",
    path: "/oa/directory",
    permission: "oa:directory:read",
    domain: "oa",
    domainTitle: "OA 办公",
    domainBadge: "OA",
    sectionLabel: "组织联络",
    kicker: "组织联络",
    microAppName: "oa-web",
    icon: "directory"
  }
];

const scrmItems: HostNavigationItem[] = [
  {
    key: "scrm-dashboard",
    title: "运营看板",
    description: "查看销售指标、趋势和经营洞察。",
    path: "/scrm/dashboard",
    permission: "dashboard:view",
    domain: "scrm",
    domainTitle: "SCRM 经营",
    domainBadge: "SCRM",
    sectionLabel: "运营总览",
    kicker: "经营判断",
    microAppName: "scrm-web",
    icon: "dashboard"
  },
  {
    key: "scrm-departments",
    title: "部门管理",
    description: "维护部门、角色与权限治理结构。",
    path: "/scrm/departments",
    permission: "department:read",
    domain: "scrm",
    domainTitle: "SCRM 经营",
    domainBadge: "SCRM",
    sectionLabel: "权限治理",
    kicker: "权限治理",
    microAppName: "scrm-web",
    icon: "department"
  },
  {
    key: "scrm-customers",
    title: "客户中心",
    description: "管理客户档案、跟进与归属关系。",
    path: "/scrm/customers",
    permission: "customer:read",
    domain: "scrm",
    domainTitle: "SCRM 经营",
    domainBadge: "SCRM",
    sectionLabel: "客户运营",
    kicker: "客户经营",
    microAppName: "scrm-web",
    icon: "customer"
  },
  {
    key: "scrm-opportunities",
    title: "商机管理",
    description: "跟踪商机阶段、负责人和预计金额。",
    path: "/scrm/opportunities",
    permission: "opportunity:read",
    domain: "scrm",
    domainTitle: "SCRM 经营",
    domainBadge: "SCRM",
    sectionLabel: "销售商机",
    kicker: "销售管道",
    microAppName: "scrm-web",
    icon: "opportunity"
  },
  {
    key: "scrm-leads",
    title: "线索中心",
    description: "集中处理线索分配、转化与跟进提醒。",
    path: "/scrm/leads",
    permission: "lead:read",
    domain: "scrm",
    domainTitle: "SCRM 经营",
    domainBadge: "SCRM",
    sectionLabel: "线索跟进",
    kicker: "线索漏斗",
    microAppName: "scrm-web",
    icon: "lead"
  },
  {
    key: "scrm-system",
    title: "系统管理",
    description: "维护字典配置、日志和系统治理能力。",
    path: "/scrm/system",
    permission: "dictionary:read",
    domain: "scrm",
    domainTitle: "SCRM 经营",
    domainBadge: "SCRM",
    sectionLabel: "平台设置",
    kicker: "系统治理",
    microAppName: "scrm-web",
    icon: "system"
  }
];

export const hostNavigationGroups: HostNavigationGroup[] = [
  {
    key: "oa",
    title: "协同事务",
    caption: "审批、请假、公告与组织联络",
    badge: "协同",
    items: oaItems
  },
  {
    key: "scrm",
    title: "经营管理",
    caption: "看板、客户、线索、商机与平台治理",
    badge: "经营",
    items: scrmItems
  }
];

export const hiddenNavigationItems: HostNavigationItem[] = [
  {
    key: "oa-announcement-detail",
    title: "公告详情",
    description: "查看单条公告的完整内容与发布时间。",
    path: "/oa/announcements/:id",
    permission: "oa:announcement:read",
    domain: "oa",
    domainTitle: "OA 办公",
    domainBadge: "OA",
    sectionLabel: "组织信息",
    kicker: "公告详情",
    microAppName: "oa-web",
    icon: "announcement",
    hidden: true
  }
];

export const visibleNavigationItems = hostNavigationGroups.flatMap((group) => group.items);
export const allNavigationItems = [...visibleNavigationItems, ...hiddenNavigationItems];

export function getVisibleNavigationGroups(permissions: string[]): HostNavigationGroup[] {
  return hostNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || permissions.includes(item.permission))
    }))
    .filter((group) => group.items.length > 0);
}

export function resolveFirstAccessiblePath(permissions: string[]): string | null {
  return visibleNavigationItems.find((item) => !item.permission || permissions.includes(item.permission))?.path ?? null;
}

export function findNavigationItemByPath(path: string): HostNavigationItem | undefined {
  return allNavigationItems.find((item) => matchesPath(item.path, path));
}

function matchesPath(pattern: string, path: string): boolean {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = path.split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => segment.startsWith(":") || segment === pathSegments[index]);
}
