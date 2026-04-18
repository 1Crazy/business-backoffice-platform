-- CreateEnum
CREATE TYPE "GovernanceHealthStatus" AS ENUM ('HEALTHY', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "SchedulerJobStatus" AS ENUM ('RUNNING', 'PAUSED');

-- CreateEnum
CREATE TYPE "SchedulerExecutionStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "StorageConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "provider" "AttachmentStorageProvider" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "GovernanceHealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "bucketName" TEXT NOT NULL,
    "regionLabel" TEXT NOT NULL,
    "previewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerJob" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "cronExpression" TEXT NOT NULL,
    "status" "SchedulerJobStatus" NOT NULL DEFAULT 'RUNNING',
    "ownerName" TEXT NOT NULL,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "lastExecutionStatus" "SchedulerExecutionStatus",
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulerJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerJobExecution" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "SchedulerExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "summary" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchedulerJobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageConfig_code_key" ON "StorageConfig"("code");

-- CreateIndex
CREATE INDEX "StorageConfig_provider_isEnabled_idx" ON "StorageConfig"("provider", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulerJob_code_key" ON "SchedulerJob"("code");

-- CreateIndex
CREATE INDEX "SchedulerJob_status_updatedAt_idx" ON "SchedulerJob"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "SchedulerJobExecution_jobId_createdAt_idx" ON "SchedulerJobExecution"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "SchedulerJobExecution_status_createdAt_idx" ON "SchedulerJobExecution"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "SchedulerJobExecution" ADD CONSTRAINT "SchedulerJobExecution_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SchedulerJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
