/** users 模块 repository：负责 users 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma, type UserStatus } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const userInclude = Prisma.validator<Prisma.UserInclude>()({
  department: true,
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  }
});

export type UserRecord = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      include: userInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  findById(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: userInclude
    });
  }

  async createUser(input: {
    username: string;
    displayName: string;
    passwordHash: string;
    email?: string | null;
    phone?: string | null;
    departmentId?: string | null;
    roleIds: string[];
  }) {
    const user = await this.prisma.user.create({
      data: {
        username: input.username,
        displayName: input.displayName,
        passwordHash: input.passwordHash,
        email: input.email ?? undefined,
        phone: input.phone ?? undefined,
        departmentId: input.departmentId ?? undefined,
        roles: {
          createMany: {
            data: input.roleIds.map((roleId) => ({ roleId }))
          }
        }
      }
    });

    return this.findById(user.id);
  }

  async updateUser(
    id: string,
    input: {
      displayName?: string;
      email?: string | null;
      phone?: string | null;
      departmentId?: string | null;
      passwordHash?: string;
      roleIds?: string[];
    }
  ) {
    await this.prisma.$transaction(async (tx) => {
      if (input.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });

        if (input.roleIds.length) {
          await tx.userRole.createMany({
            data: input.roleIds.map((roleId) => ({
              userId: id,
              roleId
            }))
          });
        }
      }

      await tx.user.update({
        where: { id },
        data: {
          displayName: input.displayName,
          email: input.email,
          phone: input.phone,
          departmentId: input.departmentId,
          passwordHash: input.passwordHash
        }
      });
    });

    return this.findById(id);
  }

  async updateStatus(id: string, status: UserStatus) {
    await this.prisma.user.update({
      where: { id },
      data: { status }
    });

    return this.findById(id);
  }
}
