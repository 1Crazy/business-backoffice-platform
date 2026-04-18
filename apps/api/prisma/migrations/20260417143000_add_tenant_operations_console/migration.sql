ALTER TABLE "Tenant"
ADD COLUMN "industry" TEXT,
ADD COLUMN "planName" TEXT NOT NULL DEFAULT '标准版',
ADD COLUMN "ownerName" TEXT NOT NULL DEFAULT '平台运营',
ADD COLUMN "ownerEmail" TEXT NOT NULL DEFAULT 'platform@example.com',
ADD COLUMN "ownerPhone" TEXT,
ADD COLUMN "initializedAt" TIMESTAMP(3),
ADD COLUMN "disabledAt" TIMESTAMP(3),
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "userQuota" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "storageQuotaMb" INTEGER NOT NULL DEFAULT 5120,
ADD COLUMN "monthlyTaskQuota" INTEGER NOT NULL DEFAULT 10000;

UPDATE "Tenant"
SET
  "planName" = COALESCE("planName", '标准版'),
  "ownerName" = COALESCE("ownerName", '平台运营'),
  "ownerEmail" = COALESCE("ownerEmail", 'platform@example.com'),
  "initializedAt" = COALESCE("initializedAt", "createdAt");
