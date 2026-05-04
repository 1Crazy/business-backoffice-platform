/** 数据范围能力：负责把角色数据范围规则转换为可复用的查询过滤与权限校验逻辑。 */
import { ForbiddenException, Injectable } from "@nestjs/common";
import { DataScope, Prisma, RecordStatus } from "@prisma/client";

import type { AuthUser } from "../auth/auth-user.interface";
import { RuntimeCacheService } from "../cache/runtime-cache.service";
import { requireTenantId, withTenantWhere } from "../tenant/tenant.util";
import type { ExtendedDataScopeRule } from "../access-policy/access-policy.types";
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtimeCacheService: RuntimeCacheService
  ) {}

  async resolveDataScope(actor: AuthUser): Promise<ResolvedDataScope> {
    const tenantId = requireTenantId(actor);
    const cacheKey = `data-scope:${tenantId}:${actor.id}`;

    return this.runtimeCacheService.getOrSet(cacheKey, 60_000, async () => {
      const scopes = await this.getScopesForUser(actor);
      const primaryScope = this.pickHighestScope(scopes);
      const extendedScope = await this.resolveExtendedScope(actor);

      if (primaryScope === DataScope.ALL) {
        return {
          primaryScope,
          scopes,
          isGlobal: true,
          departmentIds: [],
          customerPoolTagIds: extendedScope.customerPoolTagIds
        };
      }

      if (primaryScope === DataScope.SELF || !actor.departmentId) {
        return {
          primaryScope: actor.departmentId ? primaryScope : DataScope.SELF,
          scopes,
          isGlobal: false,
          departmentIds: actor.departmentId ? [actor.departmentId] : [],
          ownerIds: Array.from(new Set([actor.id, ...extendedScope.ownerIds])),
          customerPoolTagIds: extendedScope.customerPoolTagIds
        };
      }

      const departmentIds =
        primaryScope === DataScope.DEPARTMENT_AND_SUBTREE
          ? await this.getDepartmentSubtreeIds(actor.departmentId, tenantId)
          : [actor.departmentId];
      const owners = await this.prisma.user.findMany({
        where: {
          tenantId,
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
        ownerIds: Array.from(new Set([...owners.map((owner) => owner.id), ...extendedScope.ownerIds])),
        customerPoolTagIds: extendedScope.customerPoolTagIds
      };
    });
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

  async buildScopedCustomerFilter(actor: AuthUser, requestedOwnerId?: string): Promise<Prisma.CustomerWhereInput> {
    const scope = await this.resolveDataScope(actor);

    if (scope.isGlobal) {
      return requestedOwnerId ? { ownerId: requestedOwnerId } : {};
    }

    return this.buildCustomerScopedWhere(scope, requestedOwnerId);
  }

  async buildScopedOpportunityFilter(actor: AuthUser, requestedOwnerId?: string): Promise<Prisma.OpportunityWhereInput> {
    const scope = await this.resolveDataScope(actor);

    if (scope.isGlobal) {
      return requestedOwnerId ? { ownerId: requestedOwnerId } : {};
    }

    return this.buildOpportunityScopedWhere(scope, requestedOwnerId);
  }

  async canAccessOwner(actor: AuthUser, ownerId: string): Promise<boolean> {
    const scope = await this.resolveDataScope(actor);

    if (scope.isGlobal) {
      return true;
    }

    return scope.ownerIds?.includes(ownerId) ?? false;
  }

  async assertOwnerAccessible(actor: AuthUser, ownerId: string, message = "当前账号无权访问该记录。") {
    const canAccessOwner = await this.canAccessOwner(actor, ownerId);

    if (!canAccessOwner) {
      throw new ForbiddenException(message);
    }
  }

  async canAccessCustomer(actor: AuthUser, customerId: string): Promise<boolean> {
    const scope = await this.resolveDataScope(actor);

    if (scope.isGlobal) {
      return Boolean(
        await this.prisma.customer.findFirst({
          where: {
            id: customerId,
            tenantId: actor.tenantId
          },
          select: {
            id: true
          }
        })
      );
    }

    const customer = await this.prisma.customer.findFirstOrThrow({
      where: {
        id: customerId,
        tenantId: actor.tenantId
      },
      select: {
        ownerId: true,
        tags: {
          select: {
            tagId: true
          }
        }
      }
    });

    return this.matchesScopedRecord(scope, customer.ownerId, customer.tags.map((item) => item.tagId));
  }

  async assertCustomerAccessible(actor: AuthUser, customerId: string, message = "当前账号无权访问该客户。") {
    const canAccessCustomer = await this.canAccessCustomer(actor, customerId);

    if (!canAccessCustomer) {
      throw new ForbiddenException(message);
    }
  }

  async canAccessOpportunity(actor: AuthUser, opportunityId: string): Promise<boolean> {
    const scope = await this.resolveDataScope(actor);

    if (scope.isGlobal) {
      return Boolean(
        await this.prisma.opportunity.findFirst({
          where: {
            id: opportunityId,
            tenantId: actor.tenantId
          },
          select: {
            id: true
          }
        })
      );
    }

    const opportunity = await this.prisma.opportunity.findFirstOrThrow({
      where: {
        id: opportunityId,
        tenantId: actor.tenantId
      },
      select: {
        ownerId: true,
        customer: {
          select: {
            tags: {
              select: {
                tagId: true
              }
            }
          }
        }
      }
    });

    return this.matchesScopedRecord(scope, opportunity.ownerId, opportunity.customer.tags.map((item) => item.tagId));
  }

  async assertOpportunityAccessible(
    actor: AuthUser,
    opportunityId: string,
    message = "当前账号无权访问该商机。"
  ) {
    const canAccessOpportunity = await this.canAccessOpportunity(actor, opportunityId);

    if (!canAccessOpportunity) {
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
      where: withTenantWhere(requireTenantId(actor), {
        userId: actor.id,
        role: {
          is: {
            status: RecordStatus.ACTIVE
          }
        }
      }),
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

  private async resolveExtendedScope(actor: AuthUser): Promise<{
    ownerIds: string[];
    customerPoolTagIds: string[];
  }> {
    const rules = (actor.extendedDataScopes ?? []).filter((rule) => rule.values.length > 0);

    if (rules.length === 0) {
      return {
        ownerIds: [],
        customerPoolTagIds: []
      };
    }

    const ownerIds = await this.resolveOwnersFromExtendedScopeRules(actor, rules);
    const customerPoolTagIds = await this.resolveCustomerPoolTagIds(actor, rules);

    return {
      ownerIds,
      customerPoolTagIds
    };
  }

  private async resolveOwnersFromExtendedScopeRules(actor: AuthUser, rules: ExtendedDataScopeRule[]): Promise<string[]> {
    const tenantId = requireTenantId(actor);
    const ownerScopedValues = Array.from(
      new Set(
        rules
          .filter((rule) => rule.dimension !== "CUSTOMER_POOL")
          .flatMap((rule) => rule.values)
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

    const customerPoolTagIds = await this.resolveCustomerPoolTagIds(actor, rules);
    const [matchedDepartments, matchedUsers, customerPoolOwners] = await Promise.all([
      ownerScopedValues.length
        ? this.prisma.department.findMany({
            where: withTenantWhere(tenantId, {
              OR: [
                {
                  id: {
                    in: ownerScopedValues
                  }
                },
                {
                  code: {
                    in: ownerScopedValues
                  }
                },
                {
                  name: {
                    in: ownerScopedValues
                  }
                }
              ]
            }),
            select: {
              id: true
            }
          })
        : [],
      ownerScopedValues.length
        ? this.prisma.user.findMany({
            where: withTenantWhere(tenantId, {
              OR: [
                {
                  id: {
                    in: ownerScopedValues
                  }
                },
                {
                  username: {
                    in: ownerScopedValues
                  }
                },
                {
                  displayName: {
                    in: ownerScopedValues
                  }
                }
              ]
            }),
            select: {
              id: true
            }
          })
        : [],
      customerPoolTagIds.length
        ? this.prisma.customer.findMany({
            where: withTenantWhere(tenantId, {
              tags: {
                some: {
                  tagId: {
                    in: customerPoolTagIds
                  }
                }
              }
            }),
            select: {
              ownerId: true
            }
          })
        : []
    ]);

    const departmentIds = matchedDepartments.map((item) => item.id);
    const departmentUsers =
      departmentIds.length > 0
        ? await this.prisma.user.findMany({
            where: {
              tenantId,
              departmentId: {
                in: departmentIds
              }
            },
            select: {
              id: true
            }
          })
        : [];

    return Array.from(
      new Set([
        ...matchedUsers.map((item) => item.id),
        ...departmentUsers.map((item) => item.id),
        ...customerPoolOwners.map((item) => item.ownerId)
      ])
    );
  }

  private async resolveCustomerPoolTagIds(actor: AuthUser, rules: ExtendedDataScopeRule[]): Promise<string[]> {
    const customerPoolValues = Array.from(
      new Set(
        rules
          .filter((rule) => rule.dimension === "CUSTOMER_POOL")
          .flatMap((rule) => rule.values)
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

    if (customerPoolValues.length === 0) {
      return [];
    }

    const tags = await this.prisma.customerTag.findMany({
      where: withTenantWhere(requireTenantId(actor), {
        OR: [
          {
            id: {
              in: customerPoolValues
            }
          },
          {
            name: {
              in: customerPoolValues
            }
          }
        ]
      }),
      select: {
        id: true
      }
    });

    return tags.map((item) => item.id);
  }

  private matchesScopedRecord(scope: ResolvedDataScope, ownerId: string, customerTagIds: string[] = []): boolean {
    if (scope.isGlobal) {
      return true;
    }

    if (scope.ownerIds?.includes(ownerId)) {
      return true;
    }

    return customerTagIds.some((tagId) => scope.customerPoolTagIds.includes(tagId));
  }

  private buildCustomerScopedWhere(scope: ResolvedDataScope, requestedOwnerId?: string): Prisma.CustomerWhereInput {
    const accessClauses: Prisma.CustomerWhereInput[] = [];

    if (scope.ownerIds?.length) {
      accessClauses.push({
        ownerId: {
          in: scope.ownerIds
        }
      });
    }

    if (scope.customerPoolTagIds.length) {
      accessClauses.push({
        tags: {
          some: {
            tagId: {
              in: scope.customerPoolTagIds
            }
          }
        }
      });
    }

    return this.combineScopedClauses(accessClauses, requestedOwnerId);
  }

  private buildOpportunityScopedWhere(
    scope: ResolvedDataScope,
    requestedOwnerId?: string
  ): Prisma.OpportunityWhereInput {
    const accessClauses: Prisma.OpportunityWhereInput[] = [];

    if (scope.ownerIds?.length) {
      accessClauses.push({
        ownerId: {
          in: scope.ownerIds
        }
      });
    }

    if (scope.customerPoolTagIds.length) {
      accessClauses.push({
        customer: {
          tags: {
            some: {
              tagId: {
                in: scope.customerPoolTagIds
              }
            }
          }
        }
      });
    }

    return this.combineScopedClauses(accessClauses, requestedOwnerId);
  }

  private combineScopedClauses<TWhere extends Prisma.CustomerWhereInput | Prisma.OpportunityWhereInput>(
    accessClauses: TWhere[],
    requestedOwnerId?: string
  ): TWhere {
    if (accessClauses.length === 0) {
      return {
        ownerId: "__no_match__",
        ...(requestedOwnerId ? { AND: [{ ownerId: requestedOwnerId }] } : {})
      } as TWhere;
    }

    const filters: TWhere[] = [];

    if (requestedOwnerId) {
      filters.push({
        ownerId: requestedOwnerId
      } as TWhere);
    }

    if (accessClauses.length === 1) {
      filters.push(accessClauses[0]);
    } else {
      filters.push({
        OR: accessClauses
      } as unknown as TWhere);
    }

    if (filters.length === 1) {
      return filters[0];
    }

    return {
      AND: filters
    } as unknown as TWhere;
  }

  private async getDepartmentSubtreeIds(departmentId: string, tenantId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      WITH RECURSIVE "DepartmentTree" AS (
        SELECT "id"
        FROM "Department"
        WHERE "id" = ${departmentId} AND "tenantId" = ${tenantId}
        UNION ALL
        SELECT child."id"
        FROM "Department" child
        INNER JOIN "DepartmentTree" tree ON child."parentId" = tree."id"
        WHERE child."tenantId" = ${tenantId}
      )
      SELECT "id" FROM "DepartmentTree"
    `);

    return rows.map((row) => row.id);
  }
}
