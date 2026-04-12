CREATE TABLE "WorkfeedNotificationRead" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "notificationType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkfeedNotificationRead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkfeedNotificationRead_userId_notificationType_sourceId_key"
ON "WorkfeedNotificationRead"("userId", "notificationType", "sourceId");

CREATE INDEX "WorkfeedNotificationRead_userId_readAt_idx"
ON "WorkfeedNotificationRead"("userId", "readAt");

CREATE INDEX "WorkfeedNotificationRead_notificationType_sourceId_idx"
ON "WorkfeedNotificationRead"("notificationType", "sourceId");

ALTER TABLE "WorkfeedNotificationRead"
ADD CONSTRAINT "WorkfeedNotificationRead_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
