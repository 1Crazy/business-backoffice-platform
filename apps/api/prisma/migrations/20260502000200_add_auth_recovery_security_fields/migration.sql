ALTER TABLE "User"
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "passwordResetTokenHash" TEXT,
  ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3),
  ADD COLUMN "passwordResetIssuedAt" TIMESTAMP(3),
  ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "mfaSecretHash" TEXT,
  ADD COLUMN "mfaRecoveryCodeHashes" JSONB;

CREATE INDEX "User_lockedAt_idx" ON "User"("lockedAt");
