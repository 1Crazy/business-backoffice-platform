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

  list() {
    return this.prisma.role.findMany({
      include: roleInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  listPermissionCatalog() {
    return this.prisma.permission.findMany({
      orderBy: [{ group: "asc" }, { name: "asc" }]
    });
  }

  findById(id: string) {
    return this.prisma.role.findUniqueOrThrow({
      where: { id },
      include: roleInclude
    });
  }

  async createRole(input: {
    name: string;
    code: string;
    description?: string | null;
    isSystem: boolean;
    dataScope: RoleRecord["dataScope"];
    permissionIds: string[];
  }) {
    const role = await this.prisma.role.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description ?? undefined,
        isSystem: input.isSystem,
        dataScope: input.dataScope,
        permissions: {
          createMany: {
            data: input.permissionIds.map((permissionId) => ({ permissionId }))
          }
        }
      }
    });

    return this.findById(role.id);
  }

  async updateRole(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      isSystem?: boolean;
      dataScope?: RoleRecord["dataScope"];
      permissionIds?: string[];
    }
  ) {
    await this.prisma.$transaction(async (tx) => {
      if (input.permissionIds) {
        await tx.rolePermission.deleteMany({
          where: { roleId: id }
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
          dataScope: input.dataScope
        }
      });
    });

    return this.findById(id);
  }

  async updateStatus(id: string, status: RecordStatus) {
    await this.prisma.role.update({
      where: { id },
      data: {
        status
      }
    });

    return this.findById(id);
  }
}
