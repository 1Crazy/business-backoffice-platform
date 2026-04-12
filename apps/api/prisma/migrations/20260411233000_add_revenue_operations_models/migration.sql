CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

CREATE TYPE "PaymentPlanStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

CREATE TYPE "RenewalReminderStatus" AS ENUM ('PENDING', 'CONTACTED', 'COMPLETED', 'DISMISSED');

CREATE TABLE "Quote" (
  "id" TEXT NOT NULL,
  "quoteNo" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DECIMAL(18, 2) NOT NULL,
  "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT,
  "customerId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contract" (
  "id" TEXT NOT NULL,
  "contractNo" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DECIMAL(18, 2) NOT NULL,
  "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "signedAt" TIMESTAMP(3),
  "notes" TEXT,
  "customerId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentPlan" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "plannedAmount" DECIMAL(18, 2) NOT NULL,
  "receivedAmount" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  "plannedDate" TIMESTAMP(3) NOT NULL,
  "status" "PaymentPlanStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "customerId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "contractId" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentRecord" (
  "id" TEXT NOT NULL,
  "amount" DECIMAL(18, 2) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "customerId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "contractId" TEXT,
  "paymentPlanId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RenewalReminder" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "remindAt" TIMESTAMP(3) NOT NULL,
  "status" "RenewalReminderStatus" NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "customerId" TEXT NOT NULL,
  "opportunityId" TEXT,
  "contractId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RenewalReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Quote_quoteNo_key" ON "Quote"("quoteNo");
CREATE UNIQUE INDEX "Contract_contractNo_key" ON "Contract"("contractNo");

CREATE INDEX "Quote_customerId_createdAt_idx" ON "Quote"("customerId", "createdAt");
CREATE INDEX "Quote_opportunityId_createdAt_idx" ON "Quote"("opportunityId", "createdAt");
CREATE INDEX "Quote_ownerId_status_idx" ON "Quote"("ownerId", "status");
CREATE INDEX "Quote_status_expiresAt_idx" ON "Quote"("status", "expiresAt");

CREATE INDEX "Contract_customerId_createdAt_idx" ON "Contract"("customerId", "createdAt");
CREATE INDEX "Contract_opportunityId_createdAt_idx" ON "Contract"("opportunityId", "createdAt");
CREATE INDEX "Contract_ownerId_status_idx" ON "Contract"("ownerId", "status");
CREATE INDEX "Contract_status_endDate_idx" ON "Contract"("status", "endDate");

CREATE INDEX "PaymentPlan_customerId_plannedDate_idx" ON "PaymentPlan"("customerId", "plannedDate");
CREATE INDEX "PaymentPlan_opportunityId_plannedDate_idx" ON "PaymentPlan"("opportunityId", "plannedDate");
CREATE INDEX "PaymentPlan_contractId_idx" ON "PaymentPlan"("contractId");
CREATE INDEX "PaymentPlan_ownerId_status_idx" ON "PaymentPlan"("ownerId", "status");
CREATE INDEX "PaymentPlan_status_plannedDate_idx" ON "PaymentPlan"("status", "plannedDate");

CREATE INDEX "PaymentRecord_customerId_receivedAt_idx" ON "PaymentRecord"("customerId", "receivedAt");
CREATE INDEX "PaymentRecord_opportunityId_receivedAt_idx" ON "PaymentRecord"("opportunityId", "receivedAt");
CREATE INDEX "PaymentRecord_contractId_idx" ON "PaymentRecord"("contractId");
CREATE INDEX "PaymentRecord_paymentPlanId_receivedAt_idx" ON "PaymentRecord"("paymentPlanId", "receivedAt");
CREATE INDEX "PaymentRecord_ownerId_idx" ON "PaymentRecord"("ownerId");

CREATE INDEX "RenewalReminder_customerId_remindAt_idx" ON "RenewalReminder"("customerId", "remindAt");
CREATE INDEX "RenewalReminder_opportunityId_remindAt_idx" ON "RenewalReminder"("opportunityId", "remindAt");
CREATE INDEX "RenewalReminder_contractId_remindAt_idx" ON "RenewalReminder"("contractId", "remindAt");
CREATE INDEX "RenewalReminder_ownerId_status_idx" ON "RenewalReminder"("ownerId", "status");
CREATE INDEX "RenewalReminder_status_remindAt_idx" ON "RenewalReminder"("status", "remindAt");

ALTER TABLE "Quote"
ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Quote"
ADD CONSTRAINT "Quote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Quote"
ADD CONSTRAINT "Quote_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Contract"
ADD CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Contract"
ADD CONSTRAINT "Contract_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Contract"
ADD CONSTRAINT "Contract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentPlan"
ADD CONSTRAINT "PaymentPlan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentPlan"
ADD CONSTRAINT "PaymentPlan_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentPlan"
ADD CONSTRAINT "PaymentPlan_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentPlan"
ADD CONSTRAINT "PaymentPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentRecord"
ADD CONSTRAINT "PaymentRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentRecord"
ADD CONSTRAINT "PaymentRecord_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentRecord"
ADD CONSTRAINT "PaymentRecord_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentRecord"
ADD CONSTRAINT "PaymentRecord_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentRecord"
ADD CONSTRAINT "PaymentRecord_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RenewalReminder"
ADD CONSTRAINT "RenewalReminder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RenewalReminder"
ADD CONSTRAINT "RenewalReminder_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RenewalReminder"
ADD CONSTRAINT "RenewalReminder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RenewalReminder"
ADD CONSTRAINT "RenewalReminder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
