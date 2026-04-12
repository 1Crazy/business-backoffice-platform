CREATE TYPE "AdministrativeRequestType" AS ENUM ('REIMBURSEMENT', 'TRAVEL', 'PURCHASE', 'SEAL');

CREATE TYPE "AdministrativeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TYPE "AdministrativeRequestActionType" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "AdministrativeRequest" (
  "id" TEXT NOT NULL,
  "requestNo" TEXT NOT NULL,
  "type" "AdministrativeRequestType" NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "formData" JSONB NOT NULL,
  "attachmentNames" JSONB,
  "applicantId" TEXT NOT NULL,
  "approverId" TEXT NOT NULL,
  "status" "AdministrativeRequestStatus" NOT NULL DEFAULT 'PENDING',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdministrativeRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdministrativeRequestAction" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actionType" "AdministrativeRequestActionType" NOT NULL,
  "comment" TEXT,
  "snapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdministrativeRequestAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdministrativeRequest_requestNo_key" ON "AdministrativeRequest"("requestNo");
CREATE INDEX "AdministrativeRequest_applicantId_createdAt_idx" ON "AdministrativeRequest"("applicantId", "createdAt");
CREATE INDEX "AdministrativeRequest_approverId_status_idx" ON "AdministrativeRequest"("approverId", "status");
CREATE INDEX "AdministrativeRequest_type_status_idx" ON "AdministrativeRequest"("type", "status");
CREATE INDEX "AdministrativeRequest_submittedAt_idx" ON "AdministrativeRequest"("submittedAt");
CREATE INDEX "AdministrativeRequestAction_requestId_createdAt_idx" ON "AdministrativeRequestAction"("requestId", "createdAt");
CREATE INDEX "AdministrativeRequestAction_actorId_idx" ON "AdministrativeRequestAction"("actorId");

ALTER TABLE "AdministrativeRequest"
ADD CONSTRAINT "AdministrativeRequest_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdministrativeRequest"
ADD CONSTRAINT "AdministrativeRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdministrativeRequestAction"
ADD CONSTRAINT "AdministrativeRequestAction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AdministrativeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdministrativeRequestAction"
ADD CONSTRAINT "AdministrativeRequestAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
