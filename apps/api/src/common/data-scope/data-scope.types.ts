import type { DataScope } from "@prisma/client";

export interface ResolvedDataScope {
  primaryScope: DataScope;
  scopes: DataScope[];
  isGlobal: boolean;
  departmentIds: string[];
  ownerIds?: string[];
}
