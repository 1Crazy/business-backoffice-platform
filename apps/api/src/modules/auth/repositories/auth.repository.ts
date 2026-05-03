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

const sessionListSelect = Prisma.validator<Prisma.UserSessionSelect>()({
  id: true,
  tenantId: true,
  userId: true,
  expiresAt: true,
  revokedAt: true,
  lastSeenAt: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  updatedAt: true
});

export type AuthSessionListRecord = Prisma.UserSessionGetPayload<{
  select: typeof sessionListSelect;
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

  findUserByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }]
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

  updateUserSecurityState(
    userId: string,
    tenantId: string,
    data: {
      passwordHash?: string;
      lockedAt?: Date | null;
      lockEscalationCount?: number;
      securityLockStatus?: "NONE" | "REVIEW_REQUIRED" | "LOCKED";
      securityLockReason?: string | null;
      securityLockReviewedAt?: Date | null;
      securityLockReviewedById?: string | null;
      mfaEnabled?: boolean;
      mfaSecret?: string | null;
      mfaPendingSecret?: string | null;
      mfaConfiguredAt?: Date | null;
    }
  ) {
    return this.prisma.user.update({
      where: {
        id: userId,
        tenantId
      },
      data,
      include: authUserInclude
    });
  }

  findPasswordResetToken(tokenHash: string) {
    return this.prisma.userPasswordResetToken.findFirst({
      where: {
        tokenHash
      },
      include: {
        user: {
          include: authUserInclude
        }
      }
    });
  }

  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userPasswordResetToken.updateMany({
        where: {
          userId,
          usedAt: null
        },
        data: {
          usedAt: new Date()
        }
      });

      return tx.userPasswordResetToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt
        }
      });
    });
  }

  markPasswordResetTokenUsed(id: string) {
    return this.prisma.userPasswordResetToken.update({
      where: { id },
      data: {
        usedAt: new Date()
      }
    });
  }

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

  replaceMfaRecoveryCodes(userId: string, codeHashes: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userMfaRecoveryCode.deleteMany({
        where: {
          userId
        }
      });

      if (codeHashes.length === 0) {
        return [];
      }

      return tx.userMfaRecoveryCode.createMany({
        data: codeHashes.map((codeHash) => ({
          userId,
          codeHash
        }))
      });
    });
  }

  findMfaRecoveryCode(userId: string, codeHash: string) {
    return this.prisma.userMfaRecoveryCode.findFirst({
      where: {
        userId,
        codeHash,
        usedAt: null
      }
    });
  }

  markMfaRecoveryCodeUsed(id: string) {
    return this.prisma.userMfaRecoveryCode.update({
      where: { id },
      data: {
        usedAt: new Date()
      }
    });
  }

  createMfaChallenge(userId: string, tenantId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userMfaChallenge.updateMany({
        where: {
          userId,
          consumedAt: null
        },
        data: {
          consumedAt: new Date()
        }
      });

      return tx.userMfaChallenge.create({
        data: {
          userId,
          tenantId,
          tokenHash,
          expiresAt
        },
        include: {
          user: {
            include: authUserInclude
          }
        }
      });
    });
  }

  findMfaChallenge(tokenHash: string) {
    return this.prisma.userMfaChallenge.findFirst({
      where: {
        tokenHash
      },
      include: {
        user: {
          include: authUserInclude
        }
      }
    });
  }

  consumeMfaChallenge(id: string) {
    return this.prisma.userMfaChallenge.update({
      where: { id },
      data: {
        consumedAt: new Date()
      }
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

  rotateSessionRefreshToken(sessionId: string, refreshTokenHash: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash,
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
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  revokeSessionByTenant(sessionId: string, tenantId: string) {
    return this.prisma.userSession.updateMany({
      where: {
        id: sessionId,
        tenantId,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  listUserSessions(userId: string, tenantId: string) {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        tenantId
      },
      select: sessionListSelect,
      orderBy: [{ revokedAt: "asc" }, { lastSeenAt: "desc" }, { createdAt: "desc" }]
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
