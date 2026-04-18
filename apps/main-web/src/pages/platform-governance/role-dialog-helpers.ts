import type {
  ActionPermissionRule,
  ExtendedDataScopeRule,
  FieldPermissionRule,
  PermissionItem
} from "@/types/access-control";

export interface PermissionGroupSection {
  group: string;
  label: string;
  items: PermissionItem[];
}

export interface PermissionAppSection {
  appCode: string;
  label: string;
  groups: PermissionGroupSection[];
}

const APP_LABELS: Record<string, string> = {
  platform: "平台治理",
  oa: "OA 办公台",
  scrm: "SCRM 控制台"
};

const GROUP_LABELS: Record<string, string> = {
  access: "组织与授权",
  announcement: "公告通知",
  approval: "审批中心",
  customer: "客户中心",
  dashboard: "运营看板",
  directory: "组织通讯录",
  leave: "请假申请",
  lead: "线索中心",
  opportunity: "商机管理",
  request: "行政申请",
  system: "系统管理",
  workspace: "工作台"
};

export function createExtendedDataScopeRule(): ExtendedDataScopeRule {
  return {
    dimension: "TEAM",
    values: [],
    note: ""
  };
}

export function createFieldPermissionRule(): FieldPermissionRule {
  return {
    resource: "",
    field: "",
    visibility: "READONLY"
  };
}

export function createActionPermissionRule(): ActionPermissionRule {
  return {
    resource: "",
    action: "",
    allowed: false
  };
}

export function stringifyRuleValues(values?: string[] | null): string {
  return values?.join(", ") ?? "";
}

export function parseRuleValues(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildPermissionSections(permissionCatalog: PermissionItem[]): PermissionAppSection[] {
  const sections = new Map<
    string,
    {
      appCode: string;
      label: string;
      groups: Map<string, PermissionGroupSection>;
    }
  >();

  for (const item of permissionCatalog) {
    const appSection =
      sections.get(item.appCode) ??
      {
        appCode: item.appCode,
        label: APP_LABELS[item.appCode] ?? item.appCode.toUpperCase(),
        groups: new Map<string, PermissionGroupSection>()
      };

    const groupSection =
      appSection.groups.get(item.group) ??
      {
        group: item.group,
        label: GROUP_LABELS[item.group] ?? item.group,
        items: []
      };

    groupSection.items.push(item);
    appSection.groups.set(item.group, groupSection);
    sections.set(item.appCode, appSection);
  }

  return Array.from(sections.values()).map((appSection) => ({
    appCode: appSection.appCode,
    label: appSection.label,
    groups: Array.from(appSection.groups.values())
  }));
}
