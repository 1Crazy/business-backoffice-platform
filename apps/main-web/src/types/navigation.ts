/** 导航类型定义：约束主应用菜单、页面元信息与子应用归属。 */
export type HostDomain = "oa" | "scrm";
export type MicroAppName = "oa-web" | "scrm-web";
export type NavigationIcon =
  | "compass"
  | "checklist"
  | "draft"
  | "calendar"
  | "announcement"
  | "directory"
  | "dashboard"
  | "department"
  | "customer"
  | "opportunity"
  | "lead"
  | "system";

export interface HostNavigationItem {
  key: string;
  title: string;
  description: string;
  path: string;
  permission?: string;
  domain: HostDomain;
  domainTitle: string;
  domainBadge: string;
  sectionLabel: string;
  kicker: string;
  microAppName: MicroAppName;
  icon: NavigationIcon;
  hidden?: boolean;
}

export interface HostNavigationGroup {
  key: HostDomain;
  title: string;
  caption: string;
  items: HostNavigationItem[];
}
