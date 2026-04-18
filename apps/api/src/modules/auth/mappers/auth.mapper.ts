/** auth 模块 mapper：负责把持久化结果转换为对外契约或上层可消费的数据结构。 */
import { DataScope } from "@prisma/client";

import {
  readActionPermissionRules,
  readExtendedDataScopeRules,
  readFieldPermissionRules
} from "@/common/access-policy/access-policy.util";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import type { AuthUserRecord } from "../repositories/auth.repository";

export function mapAuthUser(user: AuthUserRecord): AuthUser {
  const roleCodes = user.roles.map((item) => item.role.code);
  const permissions = Array.from(
    new Set(user.roles.flatMap((item) => item.role.permissions.map((permission) => permission.permission.code)))
  );
  const dataScopes = Array.from(new Set(user.roles.map((item) => item.role.dataScope))) as DataScope[];
  const extendedDataScopes = user.roles.flatMap((item) => readExtendedDataScopeRules(item.role.extendedDataScopes));
  const fieldPermissionRules = user.roles.flatMap((item) => readFieldPermissionRules(item.role.fieldPermissionRules));
  const actionPermissionRules = user.roles.flatMap((item) => readActionPermissionRules(item.role.actionPermissionRules));

  return {
    id: user.id,
    tenantId: user.tenantId,
    tenantCode: user.tenant.code,
    username: user.username,
    displayName: user.displayName,
    departmentId: user.departmentId,
    roleCodes,
    permissions,
    dataScopes,
    extendedDataScopes,
    fieldPermissionRules,
    actionPermissionRules
  };
}
