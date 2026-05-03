ALTER TABLE "User"
  DROP COLUMN IF EXISTS "passwordResetTokenHash",
  DROP COLUMN IF EXISTS "passwordResetExpiresAt",
  DROP COLUMN IF EXISTS "passwordResetIssuedAt",
  DROP COLUMN IF EXISTS "mfaSecretHash",
  DROP COLUMN IF EXISTS "mfaRecoveryCodeHashes",
  ADD COLUMN "mfaSecret" TEXT,
  ADD COLUMN "mfaConfiguredAt" TIMESTAMP(3);

CREATE TABLE "UserPasswordHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPasswordHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserMfaRecoveryCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserMfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPasswordResetToken_tokenHash_key" ON "UserPasswordResetToken"("tokenHash");
CREATE UNIQUE INDEX "UserMfaRecoveryCode_codeHash_key" ON "UserMfaRecoveryCode"("codeHash");

CREATE INDEX "UserPasswordHistory_userId_createdAt_idx" ON "UserPasswordHistory"("userId", "createdAt");
CREATE INDEX "UserPasswordResetToken_userId_createdAt_idx" ON "UserPasswordResetToken"("userId", "createdAt");
CREATE INDEX "UserPasswordResetToken_expiresAt_idx" ON "UserPasswordResetToken"("expiresAt");
CREATE INDEX "UserPasswordResetToken_usedAt_idx" ON "UserPasswordResetToken"("usedAt");
CREATE INDEX "UserMfaRecoveryCode_userId_createdAt_idx" ON "UserMfaRecoveryCode"("userId", "createdAt");
CREATE INDEX "UserMfaRecoveryCode_usedAt_idx" ON "UserMfaRecoveryCode"("usedAt");

ALTER TABLE "UserPasswordHistory"
  ADD CONSTRAINT "UserPasswordHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPasswordResetToken"
  ADD CONSTRAINT "UserPasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserMfaRecoveryCode"
  ADD CONSTRAINT "UserMfaRecoveryCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
