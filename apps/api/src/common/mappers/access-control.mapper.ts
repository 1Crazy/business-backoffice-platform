/** 共享 mapper：负责在数据库结果、公共领域对象和对外契约之间做统一转换。 */
import { toIsoString } from "./date-time.mapper";

interface DepartmentParentRecord {
  id: string;
  name: string;
  code: string;
  status: "ACTIVE" | "DISABLED";
  parentId?: string | null;
}

interface DepartmentRecord extends DepartmentParentRecord {
  createdAt: Date;
  updatedAt: Date;
  parent?: DepartmentParentRecord | null;
}

interface PermissionRecord {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  group: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RolePermissionRelationRecord {
  permission: PermissionRecord;
}

interface RoleRecord {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  status: "ACTIVE" | "DISABLED";
  dataScope: "SELF" | "DEPARTMENT" | "DEPARTMENT_AND_SUBTREE" | "ALL";
  permissions?: RolePermissionRelationRecord[];
  createdAt: Date;
  updatedAt: Date;
}

interface UserRoleRelationRecord {
  role: RoleRecord;
}

interface UserSummaryRecord {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  status: "ACTIVE" | "DISABLED";
  departmentId?: string | null;
}

interface UserRecord extends UserSummaryRecord {
  department?: DepartmentParentRecord | null;
  roles?: UserRoleRelationRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export function mapDepartmentParent(record: DepartmentParentRecord) {
  return {
    id: record.id,
    name: record.name,
    code: record.code,
    status: record.status,
    parentId: record.parentId ?? null
  };
}

export function mapDepartment(record: DepartmentRecord) {
  return {
    ...mapDepartmentParent(record),
    parent: record.parent ? mapDepartmentParent(record.parent) : null,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapPermission(record: PermissionRecord) {
  return {
    id: record.id,
    name: record.name,
    code: record.code,
    description: record.description ?? null,
    group: record.group,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapRole(record: RoleRecord) {
  return {
    id: record.id,
    name: record.name,
    code: record.code,
    description: record.description ?? null,
    isSystem: record.isSystem,
    status: record.status,
    dataScope: record.dataScope,
    permissions: (record.permissions ?? []).map((relation) => ({
      permission: mapPermission(relation.permission)
    })),
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapUserSummary(record: UserSummaryRecord) {
  return {
    id: record.id,
    username: record.username,
    displayName: record.displayName,
    email: record.email ?? null,
    phone: record.phone ?? null,
    status: record.status,
    departmentId: record.departmentId ?? null
  };
}

export function mapUser(record: UserRecord) {
  return {
    ...mapUserSummary(record),
    department: record.department ? mapDepartmentParent(record.department) : null,
    roles: (record.roles ?? []).map((relation) => ({
      role: mapRole(relation.role)
    })),
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}
