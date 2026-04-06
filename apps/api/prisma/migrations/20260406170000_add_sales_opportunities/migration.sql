CREATE TYPE "OpportunityStage" AS ENUM ('DISCOVERY', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');

CREATE TABLE "Opportunity" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "sourceLeadId" TEXT,
  "ownerId" TEXT NOT NULL,
  "stage" "OpportunityStage" NOT NULL DEFAULT 'DISCOVERY',
  "expectedAmount" DECIMAL(18, 2) NOT NULL,
  "expectedCloseDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "notes" TEXT,
  "closedAt" TIMESTAMP(3),
  "lostReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpportunityStageHistory" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "fromStage" "OpportunityStage",
  "toStage" "OpportunityStage" NOT NULL,
  "comment" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OpportunityStageHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Opportunity_ownerId_idx" ON "Opportunity"("ownerId");
CREATE INDEX "Opportunity_customerId_idx" ON "Opportunity"("customerId");
CREATE INDEX "Opportunity_sourceLeadId_idx" ON "Opportunity"("sourceLeadId");
CREATE INDEX "Opportunity_createdAt_idx" ON "Opportunity"("createdAt");
CREATE INDEX "Opportunity_stage_expectedCloseDate_idx" ON "Opportunity"("stage", "expectedCloseDate");
CREATE INDEX "Opportunity_stage_closedAt_idx" ON "Opportunity"("stage", "closedAt");

CREATE INDEX "OpportunityStageHistory_opportunityId_createdAt_idx" ON "OpportunityStageHistory"("opportunityId", "createdAt");
CREATE INDEX "OpportunityStageHistory_createdById_idx" ON "OpportunityStageHistory"("createdById");

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_sourceLeadId_fkey" FOREIGN KEY ("sourceLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OpportunityStageHistory"
ADD CONSTRAINT "OpportunityStageHistory_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OpportunityStageHistory"
ADD CONSTRAINT "OpportunityStageHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
