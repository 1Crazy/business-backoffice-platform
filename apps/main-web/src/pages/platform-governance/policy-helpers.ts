import type {
  ActionPermissionRule,
  DataScope,
  ExtendedDataScopeRule,
  FieldPermissionRule,
  PermissionItem
} from "@/types/access-control";
import { formatDataScope } from "@/utils/display";

export interface RolePolicyPreview {
  dataScopeLabel: string;
  domainLabels: string[];
  actionLabels: string[];
  extendedScopeLabels: string[];
  fieldRuleLabels: string[];
  actionRuleLabels: string[];
  permissionCount: number;
  extendedScopeCount: number;
  fieldRuleCount: number;
  actionRuleCount: number;
}

export const DATA_SCOPE_OPTIONS: Array<{
  value: DataScope;
  label: string;
}> = [
  {
    value: "SELF",
    label: "仅本人"
  },
  {
    value: "DEPARTMENT",
    label: "本部门"
  },
  {
    value: "DEPARTMENT_AND_SUBTREE",
    label: "部门及下级"
  },
  {
    value: "ALL",
    label: "全部数据"
  }
];

export const POLICY_DIMENSION_OPTIONS: Array<{
  value: ExtendedDataScopeRule["dimension"];
  label: string;
}> = [
  {
    value: "TEAM",
    label: "团队"
  },
  {
    value: "REGION",
    label: "区域"
  },
  {
    value: "CUSTOMER_POOL",
    label: "客户池"
  },
  {
    value: "CUSTOM",
    label: "自定义"
  }
];

export const FIELD_VISIBILITY_OPTIONS: Array<{
  value: FieldPermissionRule["visibility"];
  label: string;
}> = [
  {
    value: "READ_WRITE",
    label: "可查看并编辑"
  },
  {
    value: "READONLY",
    label: "只读"
  },
  {
    value: "MASKED",
    label: "脱敏"
  },
  {
    value: "HIDDEN",
    label: "隐藏"
  }
];

const APP_LABELS: Record<string, string> = {
  platform: "平台治理",
  oa: "OA",
  scrm: "SCRM"
};

const ACTION_LABELS: Record<string, string> = {
  read: "查看",
  write: "编辑",
  assign: "分配",
  approve: "审批",
  apply: "发起",
  convert: "转化"
};

const POLICY_DIMENSION_LABELS = Object.fromEntries(POLICY_DIMENSION_OPTIONS.map((item) => [item.value, item.label])) as Record<
  ExtendedDataScopeRule["dimension"],
  string
>;

const FIELD_VISIBILITY_LABELS = Object.fromEntries(FIELD_VISIBILITY_OPTIONS.map((item) => [item.value, item.label])) as Record<
  FieldPermissionRule["visibility"],
  string
>;

function normalizeRuleText(value?: string | null): string {
  return value?.trim() ?? "";
}

export function cloneExtendedDataScopeRules(rules?: ExtendedDataScopeRule[] | null): ExtendedDataScopeRule[] {
  return (rules ?? []).map((rule) => ({
    dimension: rule.dimension,
    values: [...(rule.values ?? [])],
    note: rule.note ?? ""
  }));
}

export function cloneFieldPermissionRules(rules?: FieldPermissionRule[] | null): FieldPermissionRule[] {
  return (rules ?? []).map((rule) => ({
    resource: rule.resource,
    field: rule.field,
    visibility: rule.visibility
  }));
}

export function cloneActionPermissionRules(rules?: ActionPermissionRule[] | null): ActionPermissionRule[] {
  return (rules ?? []).map((rule) => ({
    resource: rule.resource,
    action: rule.action,
    allowed: Boolean(rule.allowed)
  }));
}

export function normalizeExtendedDataScopeRules(rules: ExtendedDataScopeRule[]): ExtendedDataScopeRule[] {
  return rules
    .map((rule) => {
      const values = (rule.values ?? []).map((item) => normalizeRuleText(item)).filter(Boolean);
      const note = normalizeRuleText(rule.note);

      return {
        dimension: rule.dimension,
        values,
        note: note || undefined
      };
    })
    .filter((rule) => rule.values.length > 0);
}

export function normalizeFieldPermissionRules(rules: FieldPermissionRule[]): FieldPermissionRule[] {
  return rules
    .map((rule) => ({
      resource: normalizeRuleText(rule.resource),
      field: normalizeRuleText(rule.field),
      visibility: rule.visibility
    }))
    .filter((rule) => Boolean(rule.resource) && Boolean(rule.field));
}

export function normalizeActionPermissionRules(rules: ActionPermissionRule[]): ActionPermissionRule[] {
  return rules
    .map((rule) => ({
      resource: normalizeRuleText(rule.resource),
      action: normalizeRuleText(rule.action),
      allowed: Boolean(rule.allowed)
    }))
    .filter((rule) => Boolean(rule.resource) && Boolean(rule.action));
}

export function buildRolePolicyPreview(input: {
  dataScope?: DataScope | null;
  permissionIds: string[];
  permissionCatalog: PermissionItem[];
  extendedDataScopes?: ExtendedDataScopeRule[];
  fieldPermissionRules?: FieldPermissionRule[];
  actionPermissionRules?: ActionPermissionRule[];
}): RolePolicyPreview {
  const selectedPermissions = input.permissionCatalog.filter((item) => input.permissionIds.includes(item.id));
  const extendedDataScopes = normalizeExtendedDataScopeRules(input.extendedDataScopes ?? []);
  const fieldPermissionRules = normalizeFieldPermissionRules(input.fieldPermissionRules ?? []);
  const actionPermissionRules = normalizeActionPermissionRules(input.actionPermissionRules ?? []);
  const domainLabels = Array.from(new Set(selectedPermissions.map((item) => APP_LABELS[item.appCode] ?? item.appCode))).slice(0, 3);
  const actionLabels = Array.from(
    new Set(
      selectedPermissions.map((item) => {
        const actionKey = item.code.split(":").at(-1) ?? item.code;
        return ACTION_LABELS[actionKey] ?? item.name;
      })
    )
  ).slice(0, 4);
  const extendedScopeLabels = extendedDataScopes.map(
    (rule) => `${POLICY_DIMENSION_LABELS[rule.dimension] ?? rule.dimension}: ${rule.values.join("、")}`
  );
  const fieldRuleLabels = fieldPermissionRules.map(
    (rule) => `${rule.resource}.${rule.field} ${FIELD_VISIBILITY_LABELS[rule.visibility] ?? rule.visibility}`
  );
  const actionRuleLabels = actionPermissionRules.map(
    (rule) => `${rule.resource}.${rule.action}${rule.allowed ? " 允许" : " 禁止"}`
  );

  return {
    dataScopeLabel: formatDataScope(input.dataScope ?? "SELF"),
    domainLabels,
    actionLabels,
    extendedScopeLabels,
    fieldRuleLabels,
    actionRuleLabels,
    permissionCount: selectedPermissions.length,
    extendedScopeCount: extendedDataScopes.length,
    fieldRuleCount: fieldPermissionRules.length,
    actionRuleCount: actionPermissionRules.length
  };
}
