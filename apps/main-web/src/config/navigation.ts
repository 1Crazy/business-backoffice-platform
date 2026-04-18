/** 主应用导航配置：集中维护可访问菜单、隐藏详情页与页面元信息，避免壳层文案散落在多个组件中。 */
import type { HostNavigationGroup, HostNavigationItem } from "@/types/navigation";

const platformItems: HostNavigationItem[] = [
  {
    key: "platform-departments",
    title: "部门治理",
    description: "维护部门结构、上下级关系与组织骨架。",
    path: "/platform/organization/departments",
    permission: "department:read",
    domain: "platform",
    domainTitle: "平台治理",
    domainBadge: "PLATFORM",
    sectionLabel: "组织架构",
    kicker: "组织治理",
    icon: "platform"
  },
  {
    key: "platform-employees",
    title: "员工治理",
    description: "维护员工账号、部门归属与角色绑定关系。",
    path: "/platform/organization/employees",
    permission: "user:read",
    domain: "platform",
    domainTitle: "平台治理",
    domainBadge: "PLATFORM",
    sectionLabel: "员工账号",
    kicker: "员工治理",
    icon: "directory"
  },
  {
    key: "platform-roles",
    title: "角色授权",
    description: "按平台治理、OA 与 SCRM 维度配置角色权限。",
    path: "/platform/access/roles",
    permission: "role:read",
    domain: "platform",
    domainTitle: "平台治理",
    domainBadge: "PLATFORM",
    sectionLabel: "授权治理",
    kicker: "角色授权",
    icon: "system"
  },
  {
    key: "platform-tenants",
    title: "租户运营",
    description: "维护租户开通、配额与运行状态。",
    path: "/platform/tenants",
    permission: "tenant:read",
    domain: "platform",
    domainTitle: "平台治理",
    domainBadge: "PLATFORM",
    sectionLabel: "平台运营",
    kicker: "租户控制台",
    icon: "platform"
  },
  {
    key: "platform-product-config",
    title: "产品配置中心",
    description: "查看默认值、行业模板和租户覆盖的继承关系。",
    path: "/platform/configuration",
    permission: "product-config:read",
    domain: "platform",
    domainTitle: "平台治理",
    domainBadge: "PLATFORM",
    sectionLabel: "产品配置",
    kicker: "配置中心",
    icon: "system"
  },
  {
    key: "platform-workfeed",
    title: "统一待办/通知",
    description: "跨 OA 与 SCRM 的待办与通知汇总。",
    path: "/workfeed",
    domain: "platform",
    domainTitle: "统一门户",
    domainBadge: "WORKFEED",
    sectionLabel: "统一协同",
    kicker: "跨域协同",
    icon: "checklist"
  }
];

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
    key: "oa-administrative-approvals",
    title: "行政审批",
    description: "集中处理报销、出差、采购和用印等行政申请。",
    path: "/oa/administrative-requests/pending",
    permission: "oa:request:approve",
    domain: "oa",
    domainTitle: "OA 办公",
    domainBadge: "OA",
    sectionLabel: "流程协同",
    kicker: "行政审批",
    microAppName: "oa-web",
    icon: "checklist"
  },
  {
    key: "oa-approvals-mine",
    title: "我发起的申请",
    description: "跟踪自己发起的请假与审批进度。",
    path: "/oa/approvals/mine",
    permission: "oa:request:apply",
    domain: "oa",
    domainTitle: "OA 办公",
    domainBadge: "OA",
    sectionLabel: "流程协同",
    kicker: "申请跟踪",
    microAppName: "oa-web",
    icon: "draft"
  },
  {
    key: "oa-administrative-requests-mine",
    title: "我的行政申请",
    description: "跟踪自己发起的报销、出差、采购与用印申请状态。",
    path: "/oa/administrative-requests/mine",
    permission: "oa:request:apply",
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
    key: "oa-administrative-request",
    title: "行政申请",
    description: "发起报销、出差、采购和用印等高频申请。",
    path: "/oa/administrative-requests/new",
    permission: "oa:request:apply",
    domain: "oa",
    domainTitle: "OA 办公",
    domainBadge: "OA",
    sectionLabel: "高频事务",
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
    key: "platform",
    title: "平台治理",
    caption: "组织、员工、角色与应用授权",
    items: platformItems
  },
  {
    key: "oa",
    title: "协同事务",
    caption: "审批、请假、公告与组织联络",
    items: oaItems
  },
  {
    key: "scrm",
    title: "经营管理",
    caption: "看板、客户、线索、商机与系统治理",
    items: scrmItems
  }
];

export const hiddenNavigationItems: HostNavigationItem[] = [];

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
