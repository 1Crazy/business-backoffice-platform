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
  name: string;
  code: string;
  group: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: "ACTIVE" | "DISABLED";
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
  permissionIds: string[];
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
  permissionIds: string[];
}

export interface UpdateRolePayload {
  name: string;
  description?: string | null;
  permissionIds: string[];
}
