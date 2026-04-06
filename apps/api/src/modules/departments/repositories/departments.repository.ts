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

  list() {
    return this.prisma.department.findMany({
      include: departmentInclude,
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  findById(id: string) {
    return this.prisma.department.findUniqueOrThrow({
      where: { id },
      include: departmentInclude
    });
  }

  async createDepartment(input: {
    name: string;
    code: string;
    parentId?: string | null;
  }) {
    const department = await this.prisma.department.create({
      data: {
        name: input.name,
        code: input.code,
        parentId: input.parentId ?? undefined
      }
    });

    return this.findById(department.id);
  }

  async updateDepartment(
    id: string,
    input: {
      name?: string;
      code?: string;
      parentId?: string | null;
    }
  ) {
    await this.prisma.department.update({
      where: { id },
      data: {
        name: input.name,
        code: input.code,
        parentId: input.parentId
      }
    });

    return this.findById(id);
  }

  async updateStatus(id: string, status: RecordStatus) {
    await this.prisma.department.update({
      where: { id },
      data: {
        status
      }
    });

    return this.findById(id);
  }
}
