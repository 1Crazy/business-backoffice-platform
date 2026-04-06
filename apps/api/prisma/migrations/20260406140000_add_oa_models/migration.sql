CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TYPE "ApprovalActionDecision" AS ENUM ('APPROVED', 'REJECTED');

CREATE TABLE "LeaveRequest" (
  "id" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "approverId" TEXT NOT NULL,
  "leaveType" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeaveApprovalAction" (
  "id" TEXT NOT NULL,
  "leaveRequestId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "decision" "ApprovalActionDecision" NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LeaveApprovalAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "content" TEXT NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "publishedById" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeaveRequest_applicantId_createdAt_idx" ON "LeaveRequest"("applicantId", "createdAt");
CREATE INDEX "LeaveRequest_approverId_status_idx" ON "LeaveRequest"("approverId", "status");
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

CREATE INDEX "LeaveApprovalAction_leaveRequestId_createdAt_idx" ON "LeaveApprovalAction"("leaveRequestId", "createdAt");
CREATE INDEX "LeaveApprovalAction_actorId_idx" ON "LeaveApprovalAction"("actorId");

CREATE INDEX "Announcement_status_publishedAt_idx" ON "Announcement"("status", "publishedAt");
CREATE INDEX "Announcement_publishedById_idx" ON "Announcement"("publishedById");

ALTER TABLE "LeaveRequest"
ADD CONSTRAINT "LeaveRequest_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeaveRequest"
ADD CONSTRAINT "LeaveRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeaveApprovalAction"
ADD CONSTRAINT "LeaveApprovalAction_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeaveApprovalAction"
ADD CONSTRAINT "LeaveApprovalAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Announcement"
ADD CONSTRAINT "Announcement_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
