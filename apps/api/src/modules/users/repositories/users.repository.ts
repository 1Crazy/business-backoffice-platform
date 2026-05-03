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

  listPasswordHistory(userId: string, limit: number) {
    return this.prisma.userPasswordHistory.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });
  }

  createPasswordHistory(userId: string, passwordHash: string) {
    return this.prisma.userPasswordHistory.create({
      data: {
        userId,
        passwordHash
      }
    });
  }

  list(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId
      },
      include: userInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  findById(id: string, tenantId: string) {
    return this.prisma.user.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      include: userInclude
    });
  }

  async createUser(input: {
    tenantId: string;
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
        tenantId: input.tenantId,
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

    return this.findById(user.id, input.tenantId);
  }

  async updateUser(
    id: string,
    tenantId: string,
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
        await tx.userRole.deleteMany({
          where: {
            userId: id,
            user: {
              tenantId
            }
          }
        });

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

      if (input.passwordHash) {
        await tx.userPasswordHistory.create({
          data: {
            userId: id,
            passwordHash: input.passwordHash
          }
        });
      }
    });

    return this.findById(id, tenantId);
  }

  async updateStatus(id: string, tenantId: string, status: UserStatus) {
    await this.prisma.user.updateMany({
      where: {
        id,
        tenantId
      },
      data: { status }
    });

    return this.findById(id, tenantId);
  }

  async unlockUser(id: string, tenantId: string) {
    await this.prisma.user.updateMany({
      where: {
        id,
        tenantId
      },
      data: {
        lockedAt: null,
        securityLockStatus: "NONE",
        securityLockReason: null,
        securityLockReviewedAt: new Date()
      }
    });

    return this.findById(id, tenantId);
  }
}
