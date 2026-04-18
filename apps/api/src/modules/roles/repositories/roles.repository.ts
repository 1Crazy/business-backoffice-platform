/** roles 模块 repository：负责 roles 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma, type RecordStatus } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const roleInclude = Prisma.validator<Prisma.RoleInclude>()({
  permissions: {
    include: {
      permission: true
    }
  }
});

export type RoleRecord = Prisma.RoleGetPayload<{
  include: typeof roleInclude;
}>;

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.role.findMany({
      where: {
        tenantId
      },
      include: roleInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  listPermissionCatalog() {
    return this.prisma.permission.findMany({
      orderBy: [{ appCode: "asc" }, { group: "asc" }, { name: "asc" }]
    });
  }

  findById(id: string, tenantId: string) {
    return this.prisma.role.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      include: roleInclude
    });
  }

  async createRole(input: {
    tenantId: string;
    name: string;
    code: string;
    description?: string | null;
    isSystem: boolean;
    dataScope: RoleRecord["dataScope"];
    permissionIds: string[];
    extendedDataScopes?: Prisma.InputJsonValue;
    fieldPermissionRules?: Prisma.InputJsonValue;
    actionPermissionRules?: Prisma.InputJsonValue;
  }) {
    const role = await this.prisma.role.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        code: input.code,
        description: input.description ?? undefined,
        isSystem: input.isSystem,
        dataScope: input.dataScope,
        extendedDataScopes: input.extendedDataScopes,
        fieldPermissionRules: input.fieldPermissionRules,
        actionPermissionRules: input.actionPermissionRules,
        permissions: {
          createMany: {
            data: input.permissionIds.map((permissionId) => ({ permissionId }))
          }
        }
      }
    });

    return this.findById(role.id, input.tenantId);
  }

  async updateRole(
    id: string,
    tenantId: string,
    input: {
      name?: string;
      description?: string | null;
      isSystem?: boolean;
      dataScope?: RoleRecord["dataScope"];
      permissionIds?: string[];
      extendedDataScopes?: Prisma.InputJsonValue;
      fieldPermissionRules?: Prisma.InputJsonValue;
      actionPermissionRules?: Prisma.InputJsonValue;
    }
  ) {
    await this.prisma.$transaction(async (tx) => {
      if (input.permissionIds) {
      await tx.rolePermission.deleteMany({
          where: {
            roleId: id,
            role: {
              tenantId
            }
          }
        });

        if (input.permissionIds.length) {
          await tx.rolePermission.createMany({
            data: input.permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId
            }))
          });
        }
      }

      await tx.role.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          isSystem: input.isSystem,
          dataScope: input.dataScope,
          extendedDataScopes: input.extendedDataScopes,
          fieldPermissionRules: input.fieldPermissionRules,
          actionPermissionRules: input.actionPermissionRules
        }
      });
    });

    return this.findById(id, tenantId);
  }

  async updateStatus(id: string, tenantId: string, status: RecordStatus) {
    await this.prisma.role.updateMany({
      where: {
        id,
        tenantId
      },
      data: {
        status
      }
    });

    return this.findById(id, tenantId);
  }
}
