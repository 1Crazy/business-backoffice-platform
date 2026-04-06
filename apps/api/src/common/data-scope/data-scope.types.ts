/** 数据范围能力：负责把角色数据范围规则转换为可复用的查询过滤与权限校验逻辑。 */
import type { DataScope } from "@prisma/client";

export interface ResolvedDataScope {
  primaryScope: DataScope;
  scopes: DataScope[];
  isGlobal: boolean;
  departmentIds: string[];
  ownerIds?: string[];
}
