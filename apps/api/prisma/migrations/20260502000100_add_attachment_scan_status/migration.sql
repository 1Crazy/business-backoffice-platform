CREATE TYPE "AttachmentScanStatus" AS ENUM ('PENDING', 'CLEAN', 'MALICIOUS', 'SKIPPED', 'ERROR');

ALTER TABLE "Attachment"
  ADD COLUMN "scanStatus" "AttachmentScanStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "scanProvider" TEXT,
  ADD COLUMN "scanMessage" TEXT,
  ADD COLUMN "scannedAt" TIMESTAMP(3);

CREATE INDEX "Attachment_scanStatus_idx" ON "Attachment"("scanStatus");
