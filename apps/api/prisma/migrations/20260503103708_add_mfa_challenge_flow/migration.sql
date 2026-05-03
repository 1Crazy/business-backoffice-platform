ALTER TYPE "AuditActionType" ADD VALUE IF NOT EXISTS 'MFA_CHALLENGE';
ALTER TYPE "AuditActionType" ADD VALUE IF NOT EXISTS 'MFA_VERIFIED';
ALTER TYPE "AuditActionType" ADD VALUE IF NOT EXISTS 'MFA_RECOVERY_USED';
ALTER TYPE "AuditActionType" ADD VALUE IF NOT EXISTS 'MFA_CONFIGURED';

ALTER TABLE "User"
  ADD COLUMN "mfaPendingSecret" TEXT;

CREATE TABLE "UserMfaChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserMfaChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserMfaChallenge_tokenHash_key" ON "UserMfaChallenge"("tokenHash");
CREATE INDEX "UserMfaChallenge_userId_createdAt_idx" ON "UserMfaChallenge"("userId", "createdAt");
CREATE INDEX "UserMfaChallenge_tenantId_expiresAt_idx" ON "UserMfaChallenge"("tenantId", "expiresAt");
CREATE INDEX "UserMfaChallenge_consumedAt_idx" ON "UserMfaChallenge"("consumedAt");

ALTER TABLE "UserMfaChallenge"
  ADD CONSTRAINT "UserMfaChallenge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserMfaChallenge"
  ADD CONSTRAINT "UserMfaChallenge_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
