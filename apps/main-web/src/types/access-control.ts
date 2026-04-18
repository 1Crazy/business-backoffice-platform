/** 领域类型定义：负责维护当前子域的请求、响应和表单模型契约。 */
export interface Department {
  id: string;
  name: string;
  code: string;
  status: "ACTIVE" | "DISABLED";
  parentId?: string | null;
  parent?: Department | null;
}

export interface PermissionItem {
  id: string;
  appCode: string;
  name: string;
  code: string;
  group: string;
}

export type DataScope = "SELF" | "DEPARTMENT" | "DEPARTMENT_AND_SUBTREE" | "ALL";
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

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem?: boolean;
  status: "ACTIVE" | "DISABLED";
  dataScope?: DataScope;
  extendedDataScopes: ExtendedDataScopeRule[];
  fieldPermissionRules: FieldPermissionRule[];
  actionPermissionRules: ActionPermissionRule[];
  permissions: Array<{
    permission: PermissionItem;
  }>;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  status: "ACTIVE" | "DISABLED";
  departmentId?: string | null;
  department?: Department | null;
  roles: Array<{
    role: Role;
  }>;
}

export interface DepartmentFormModel {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
}

export interface UserFormModel {
  id: string;
  username: string;
  displayName: string;
  password: string;
  email: string;
  phone: string;
  departmentId: string | null;
  roleIds: string[];
}

export interface RoleFormModel {
  id: string;
  name: string;
  code: string;
  description: string;
  dataScope: DataScope;
  permissionIds: string[];
  extendedDataScopes: ExtendedDataScopeRule[];
  fieldPermissionRules: FieldPermissionRule[];
  actionPermissionRules: ActionPermissionRule[];
}

export interface SaveDepartmentPayload {
  name: string;
  code: string;
  parentId?: string | null;
}

export interface CreateUserPayload {
  username: string;
  displayName: string;
  password: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  roleIds: string[];
}

export interface UpdateUserPayload {
  displayName: string;
  password?: string;
  email?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  roleIds: string[];
}

export interface CreateRolePayload {
  name: string;
  code: string;
  description?: string;
  dataScope: DataScope;
  permissionIds: string[];
  policyBundle: {
    extendedDataScopes: ExtendedDataScopeRule[];
    fieldPermissionRules: FieldPermissionRule[];
    actionPermissionRules: ActionPermissionRule[];
  };
}

export interface UpdateRolePayload {
  name: string;
  description?: string | null;
  dataScope: DataScope;
  permissionIds: string[];
  policyBundle: {
    extendedDataScopes: ExtendedDataScopeRule[];
    fieldPermissionRules: FieldPermissionRule[];
    actionPermissionRules: ActionPermissionRule[];
  };
}
