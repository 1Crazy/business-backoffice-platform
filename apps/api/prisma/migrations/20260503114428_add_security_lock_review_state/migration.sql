CREATE TYPE "UserSecurityLockStatus" AS ENUM ('NONE', 'REVIEW_REQUIRED', 'LOCKED');

ALTER TABLE "User"
  ADD COLUMN "securityLockStatus" "UserSecurityLockStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "securityLockReason" TEXT,
  ADD COLUMN "securityLockReviewedAt" TIMESTAMP(3),
  ADD COLUMN "securityLockReviewedById" TEXT;

CREATE INDEX "User_securityLockStatus_idx" ON "User"("securityLockStatus");
