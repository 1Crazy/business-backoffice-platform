-- CreateEnum
CREATE TYPE "NotificationDomain" AS ENUM ('OA', 'SCRM', 'PLATFORM', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationEventStatus" AS ENUM ('PENDING', 'ROUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationRecordStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'ENTERPRISE_IM');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "NotificationDigestMode" AS ENUM ('IMMEDIATE', 'HOURLY', 'DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "domain" "NotificationDomain" NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "NotificationEventStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "targetPath" TEXT,
    "targetLabel" TEXT,
    "actorId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecord" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "domain" "NotificationDomain" NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "NotificationRecordStatus" NOT NULL DEFAULT 'UNREAD',
    "targetPath" TEXT,
    "targetLabel" TEXT,
    "channelPreferences" JSONB,
    "routingSnapshot" JSONB,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "adapterCode" TEXT,
    "provider" TEXT,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "externalMessageId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "response" JSONB,
    "errorMessage" TEXT,
    "lastAttemptedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" "NotificationDomain" NOT NULL,
    "eventType" TEXT NOT NULL,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "enterpriseImEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestMode" "NotificationDigestMode" NOT NULL DEFAULT 'IMMEDIATE',
    "reminderFrequencyMinutes" INTEGER,
    "nudgeThresholdMinutes" INTEGER,
    "quietHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationChannelConfig" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "adapterCode" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "capabilities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationChannelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationEvent_domain_occurredAt_idx" ON "NotificationEvent"("domain", "occurredAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_eventType_occurredAt_idx" ON "NotificationEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_sourceType_sourceId_idx" ON "NotificationEvent"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "NotificationEvent_status_createdAt_idx" ON "NotificationEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_actorId_createdAt_idx" ON "NotificationEvent"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationRecord_recipientId_status_createdAt_idx" ON "NotificationRecord"("recipientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationRecord_eventId_idx" ON "NotificationRecord"("eventId");

-- CreateIndex
CREATE INDEX "NotificationRecord_domain_eventType_idx" ON "NotificationRecord"("domain", "eventType");

-- CreateIndex
CREATE INDEX "NotificationRecord_readAt_idx" ON "NotificationRecord"("readAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_channel_idx" ON "NotificationDelivery"("notificationId", "channel");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_createdAt_idx" ON "NotificationDelivery"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_adapterCode_idx" ON "NotificationDelivery"("adapterCode");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_domain_eventType_key" ON "NotificationPreference"("userId", "domain", "eventType");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_domain_idx" ON "NotificationPreference"("userId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationChannelConfig_adapterCode_key" ON "NotificationChannelConfig"("adapterCode");

-- CreateIndex
CREATE INDEX "NotificationChannelConfig_channel_isEnabled_idx" ON "NotificationChannelConfig"("channel", "isEnabled");

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecord" ADD CONSTRAINT "NotificationRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NotificationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecord" ADD CONSTRAINT "NotificationRecord_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "NotificationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
