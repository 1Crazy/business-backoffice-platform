/** 细粒度策略类型：负责统一描述认证上下文、角色策略与共享策略服务之间的契约。 */
export type PolicyDimension = "TEAM" | "REGION" | "CUSTOMER_POOL" | "CUSTOM";
export type FieldVisibility = "READ_WRITE" | "READONLY" | "MASKED" | "HIDDEN";

export interface ExtendedDataScopeRule {
  dimension: PolicyDimension;
  values: string[];
  note?: string | null;
}

export interface FieldPermissionRule {
  resource: string;
  field: string;
  visibility: FieldVisibility;
}

export interface ActionPermissionRule {
  resource: string;
  action: string;
  allowed: boolean;
}
