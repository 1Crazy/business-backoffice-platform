ALTER TABLE "Permission"
ADD COLUMN "appCode" TEXT NOT NULL DEFAULT 'scrm';

DROP INDEX "Permission_group_idx";

CREATE INDEX "Permission_appCode_group_idx" ON "Permission"("appCode", "group");
