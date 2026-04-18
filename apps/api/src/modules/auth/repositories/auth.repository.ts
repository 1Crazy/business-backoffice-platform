/** auth 模块 repository：负责 auth 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const authUserInclude = Prisma.validator<Prisma.UserInclude>()({
  tenant: true,
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

const sessionInclude = Prisma.validator<Prisma.UserSessionInclude>()({
  user: {
    include: authUserInclude
  }
});

export type AuthUserRecord = Prisma.UserGetPayload<{
  include: typeof authUserInclude;
}>;

export type AuthSessionRecord = Prisma.UserSessionGetPayload<{
  include: typeof sessionInclude;
}>;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByUsername(username: string) {
    return this.prisma.user.findFirst({
      where: {
        username
      },
      include: authUserInclude
    });
  }

  findUserById(userId: string, tenantId?: string) {
    return this.prisma.user.findFirstOrThrow({
      where: {
        id: userId,
        tenantId
      },
      include: authUserInclude
    });
  }

  findSessionByRefreshTokenHash(refreshTokenHash: string) {
    return this.prisma.userSession.findFirst({
      where: {
        refreshTokenHash
      },
      include: sessionInclude
    });
  }

  touchSession(sessionId: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        lastSeenAt: new Date()
      }
    });
  }

  revokeSession(sessionId: string, userId: string, tenantId: string) {
    return this.prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId,
        tenantId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  findSessionById(sessionId: string, tenantId?: string) {
    return this.prisma.userSession.findFirst({
      where: {
        id: sessionId,
        tenantId
      }
    });
  }

  createUserSession(userId: string, tenantId: string, refreshTokenHash: string, expiresAt: Date) {
    return this.prisma.userSession.create({
      data: {
        userId,
        tenantId,
        refreshTokenHash,
        expiresAt,
        lastSeenAt: new Date()
      }
    });
  }
}
