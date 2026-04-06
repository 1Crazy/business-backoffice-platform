/** 数据范围能力：负责把角色数据范围规则转换为可复用的查询过滤与权限校验逻辑。 */
import { ForbiddenException, Injectable } from "@nestjs/common";
import { DataScope, Prisma, RecordStatus } from "@prisma/client";

import type { AuthUser } from "../auth/auth-user.interface";
import { PrismaService } from "../prisma/prisma.service";
import type { ResolvedDataScope } from "./data-scope.types";

const DATA_SCOPE_PRIORITY: Record<DataScope, number> = {
  [DataScope.SELF]: 1,
  [DataScope.DEPARTMENT]: 2,
  [DataScope.DEPARTMENT_AND_SUBTREE]: 3,
  [DataScope.ALL]: 4
};

@Injectable()
export class DataScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveDataScope(actor: AuthUser): Promise<ResolvedDataScope> {
    const scopes = await this.getScopesForUser(actor);
    const primaryScope = this.pickHighestScope(scopes);

    if (primaryScope === DataScope.ALL) {
      return {
        primaryScope,
        scopes,
        isGlobal: true,
        departmentIds: []
      };
    }

    if (primaryScope === DataScope.SELF || !actor.departmentId) {
      return {
        primaryScope: actor.departmentId ? primaryScope : DataScope.SELF,
        scopes,
        isGlobal: false,
        departmentIds: actor.departmentId ? [actor.departmentId] : [],
        ownerIds: [actor.id]
      };
    }

    const departmentIds =
      primaryScope === DataScope.DEPARTMENT_AND_SUBTREE
        ? await this.getDepartmentSubtreeIds(actor.departmentId)
        : [actor.departmentId];
    const owners = await this.prisma.user.findMany({
      where: {
        departmentId: {
          in: departmentIds
        }
      },
      select: {
        id: true
      }
    });

    return {
      primaryScope,
      scopes,
      isGlobal: false,
      departmentIds,
      ownerIds: owners.map((owner) => owner.id)
    };
  }

  async resolveAccessibleOwnerIds(actor: AuthUser): Promise<string[] | undefined> {
    const scope = await this.resolveDataScope(actor);
    return scope.ownerIds;
  }

  async buildScopedOwnerFilter(actor: AuthUser, requestedOwnerId?: string) {
    const scope = await this.resolveDataScope(actor);

    if (scope.isGlobal) {
      return requestedOwnerId ? { ownerId: requestedOwnerId } : {};
    }

    const ownerIds = scope.ownerIds ?? [];

    if (requestedOwnerId) {
      return {
        ownerId: ownerIds.includes(requestedOwnerId) ? requestedOwnerId : "__no_match__"
      };
    }

    return {
      ownerId: {
        in: ownerIds
      }
    };
  }

  async canAccessOwner(actor: AuthUser, ownerId: string): Promise<boolean> {
    const scope = await this.resolveDataScope(actor);

    if (scope.isGlobal) {
      return true;
    }

    return scope.ownerIds?.includes(ownerId) ?? false;
  }

  async assertOwnerAccessible(actor: AuthUser, ownerId: string, message = "You do not have access to this record.") {
    const canAccessOwner = await this.canAccessOwner(actor, ownerId);

    if (!canAccessOwner) {
      throw new ForbiddenException(message);
    }
  }

  private async getScopesForUser(actor: AuthUser): Promise<DataScope[]> {
    if (actor.roleCodes.includes("super-admin")) {
      return [DataScope.ALL];
    }

    if (actor.dataScopes?.length) {
      return Array.from(new Set(actor.dataScopes));
    }

    const roleAssignments = await this.prisma.userRole.findMany({
      where: {
        userId: actor.id,
        role: {
          is: {
            status: RecordStatus.ACTIVE
          }
        }
      },
      select: {
        role: {
          select: {
            dataScope: true
          }
        }
      }
    });

    const scopes = Array.from(new Set(roleAssignments.map((assignment) => assignment.role.dataScope)));

    if (scopes.length > 0) {
      return scopes;
    }

    return this.inferScopesFromRoleCodes(actor.roleCodes);
  }

  private inferScopesFromRoleCodes(roleCodes: string[]): DataScope[] {
    if (roleCodes.includes("sales-manager")) {
      return [DataScope.DEPARTMENT];
    }

    return [DataScope.SELF];
  }

  private pickHighestScope(scopes: DataScope[]): DataScope {
    return scopes.reduce((highest, scope) =>
      DATA_SCOPE_PRIORITY[scope] > DATA_SCOPE_PRIORITY[highest] ? scope : highest
    );
  }

  private async getDepartmentSubtreeIds(departmentId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      WITH RECURSIVE "DepartmentTree" AS (
        SELECT "id"
        FROM "Department"
        WHERE "id" = ${departmentId}
        UNION ALL
        SELECT child."id"
        FROM "Department" child
        INNER JOIN "DepartmentTree" tree ON child."parentId" = tree."id"
      )
      SELECT "id" FROM "DepartmentTree"
    `);

    return rows.map((row) => row.id);
  }
}
