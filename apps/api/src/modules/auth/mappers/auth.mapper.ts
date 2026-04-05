import { DataScope } from "@prisma/client";

import type { AuthUser } from "../../../common/auth/auth-user.interface";
import type { AuthUserRecord } from "../repositories/auth.repository";

export function mapAuthUser(user: AuthUserRecord): AuthUser {
  const roleCodes = user.roles.map((item) => item.role.code);
  const permissions = Array.from(
    new Set(user.roles.flatMap((item) => item.role.permissions.map((permission) => permission.permission.code)))
  );
  const dataScopes = Array.from(new Set(user.roles.map((item) => item.role.dataScope))) as DataScope[];

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    departmentId: user.departmentId,
    roleCodes,
    permissions,
    dataScopes
  };
}
