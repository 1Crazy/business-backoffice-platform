/** departments 模块 repository：负责 departments 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma, type RecordStatus } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const departmentInclude = Prisma.validator<Prisma.DepartmentInclude>()({
  parent: true
});

export type DepartmentRecord = Prisma.DepartmentGetPayload<{
  include: typeof departmentInclude;
}>;

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.department.findMany({
      where: {
        tenantId
      },
      include: departmentInclude,
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  findById(id: string, tenantId: string) {
    return this.prisma.department.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      include: departmentInclude
    });
  }

  async createDepartment(input: {
    tenantId: string;
    name: string;
    code: string;
    parentId?: string | null;
  }) {
    const department = await this.prisma.department.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        code: input.code,
        parentId: input.parentId ?? undefined
      }
    });

    return this.findById(department.id, input.tenantId);
  }

  async updateDepartment(
    id: string,
    tenantId: string,
    input: {
      name?: string;
      code?: string;
      parentId?: string | null;
    }
  ) {
    await this.prisma.department.updateMany({
      where: {
        id,
        tenantId
      },
      data: {
        name: input.name,
        code: input.code,
        parentId: input.parentId
      }
    });

    return this.findById(id, tenantId);
  }

  async updateStatus(id: string, tenantId: string, status: RecordStatus) {
    await this.prisma.department.updateMany({
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
