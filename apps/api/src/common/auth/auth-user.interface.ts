/** 认证基础设施：负责承载当前登录用户上下文和 JWT 鉴权相关能力。 */
import type { DataScope } from "@prisma/client";

import type {
  ActionPermissionRule,
  ExtendedDataScopeRule,
  FieldPermissionRule
} from "../access-policy/access-policy.types";

export interface AuthUser {
  id: string;
  tenantId?: string;
  tenantCode?: string;
  username: string;
  displayName: string;
  departmentId?: string | null;
  roleCodes: string[];
  permissions: string[];
  dataScopes?: DataScope[];
  extendedDataScopes?: ExtendedDataScopeRule[];
  fieldPermissionRules?: FieldPermissionRule[];
  actionPermissionRules?: ActionPermissionRule[];
  sessionId?: string;
}
