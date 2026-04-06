/** 认证基础设施：负责承载当前登录用户上下文和 JWT 鉴权相关能力。 */
import type { DataScope } from "@prisma/client";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  departmentId?: string | null;
  roleCodes: string[];
  permissions: string[];
  dataScopes?: DataScope[];
  sessionId?: string;
}
