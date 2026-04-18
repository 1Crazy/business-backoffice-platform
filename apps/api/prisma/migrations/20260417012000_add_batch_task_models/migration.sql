CREATE TYPE "BatchTaskCategory" AS ENUM ('IMPORT', 'EXPORT');
CREATE TYPE "BatchTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "BatchTask" (
  "id" TEXT NOT NULL,
  "category" "BatchTaskCategory" NOT NULL,
  "resourceType" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "status" "BatchTaskStatus" NOT NULL DEFAULT 'PENDING',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "totalCount" INTEGER NOT NULL DEFAULT 0,
  "successCount" INTEGER NOT NULL DEFAULT 0,
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "operatorId" TEXT NOT NULL,
  "filterSnapshot" JSONB,
  "summary" TEXT,
  "failureSummary" TEXT,
  "inputFileName" TEXT,
  "resultFileName" TEXT,
  "resultMimeType" TEXT,
  "resultStorageProvider" "AttachmentStorageProvider",
  "resultStorageKey" TEXT,
  "failureFileName" TEXT,
  "failureMimeType" TEXT,
  "failureStorageProvider" "AttachmentStorageProvider",
  "failureStorageKey" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BatchTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BatchTaskFailure" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "rowNumber" INTEGER,
  "identifier" TEXT,
  "reason" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BatchTaskFailure_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BatchTask_category_status_createdAt_idx" ON "BatchTask"("category", "status", "createdAt");
CREATE INDEX "BatchTask_resourceType_createdAt_idx" ON "BatchTask"("resourceType", "createdAt");
CREATE INDEX "BatchTask_operatorId_createdAt_idx" ON "BatchTask"("operatorId", "createdAt");
CREATE INDEX "BatchTaskFailure_taskId_createdAt_idx" ON "BatchTaskFailure"("taskId", "createdAt");

ALTER TABLE "BatchTask"
ADD CONSTRAINT "BatchTask_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BatchTaskFailure"
ADD CONSTRAINT "BatchTaskFailure_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "BatchTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
