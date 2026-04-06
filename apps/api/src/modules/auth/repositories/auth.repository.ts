/** auth 模块 repository：负责 auth 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const authUserInclude = Prisma.validator<Prisma.UserInclude>()({
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
    return this.prisma.user.findUnique({
      where: { username },
      include: authUserInclude
    });
  }

  findUserById(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: authUserInclude
    });
  }

  findSessionByRefreshTokenHash(refreshTokenHash: string) {
    return this.prisma.userSession.findUnique({
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

  revokeSession(sessionId: string, userId: string) {
    return this.prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  findSessionById(sessionId: string) {
    return this.prisma.userSession.findUnique({
      where: {
        id: sessionId
      }
    });
  }

  createUserSession(userId: string, refreshTokenHash: string, expiresAt: Date) {
    return this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
        lastSeenAt: new Date()
      }
    });
  }
}
