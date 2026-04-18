CREATE TABLE "Tenant" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

INSERT INTO "Tenant" ("id", "code", "name", "status", "isDefault", "createdAt", "updatedAt")
VALUES ('tenant_default_platform', 'default', '默认租户', 'ACTIVE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "status" = EXCLUDED."status",
    "isDefault" = EXCLUDED."isDefault",
    "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "Department" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Role" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "CustomerTag" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Opportunity" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "OpportunityStageHistory" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Quote" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Contract" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PaymentPlan" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PaymentRecord" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "RenewalReminder" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "FollowUp" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Reminder" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "UserSession" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "WorkfeedNotificationRead" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "NotificationEvent" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "NotificationRecord" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "NotificationPreference" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "BatchTask" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "LeaveApprovalAction" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "AdministrativeRequest" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "AdministrativeRequestAction" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "WorkflowTemplate" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "WorkflowInstance" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "WorkflowTask" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "WorkflowAction" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "WorkflowCcRecipient" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Announcement" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "DictionaryEntry" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Attachment" ADD COLUMN "tenantId" TEXT;

DO $$
DECLARE
  default_tenant_id TEXT;
BEGIN
  SELECT "id" INTO default_tenant_id FROM "Tenant" WHERE "code" = 'default' LIMIT 1;

  UPDATE "Department" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "User" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Role" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Customer" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "CustomerTag" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Lead" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Opportunity" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "OpportunityStageHistory" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Quote" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Contract" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "PaymentPlan" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "PaymentRecord" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "RenewalReminder" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "FollowUp" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Reminder" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "AuditLog" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "UserSession" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "WorkfeedNotificationRead" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "NotificationEvent" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "NotificationRecord" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "NotificationPreference" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "BatchTask" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "LeaveRequest" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "LeaveApprovalAction" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "AdministrativeRequest" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "AdministrativeRequestAction" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "WorkflowTemplate" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "WorkflowTemplateNode" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "WorkflowInstance" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "WorkflowTask" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "WorkflowAction" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "WorkflowCcRecipient" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Announcement" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "DictionaryEntry" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "Attachment" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
END $$;

ALTER TABLE "Department" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Role" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CustomerTag" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Opportunity" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "OpportunityStageHistory" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Quote" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Contract" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PaymentPlan" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PaymentRecord" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RenewalReminder" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "FollowUp" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Reminder" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "UserSession" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DictionaryEntry" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Attachment" ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX "Department_tenantId_idx" ON "Department"("tenantId");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "Role_tenantId_idx" ON "Role"("tenantId");
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");
CREATE INDEX "CustomerTag_tenantId_idx" ON "CustomerTag"("tenantId");
CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId");
CREATE INDEX "Opportunity_tenantId_idx" ON "Opportunity"("tenantId");
CREATE INDEX "OpportunityStageHistory_tenantId_idx" ON "OpportunityStageHistory"("tenantId");
CREATE INDEX "Quote_tenantId_idx" ON "Quote"("tenantId");
CREATE INDEX "Contract_tenantId_idx" ON "Contract"("tenantId");
CREATE INDEX "PaymentPlan_tenantId_idx" ON "PaymentPlan"("tenantId");
CREATE INDEX "PaymentRecord_tenantId_idx" ON "PaymentRecord"("tenantId");
CREATE INDEX "RenewalReminder_tenantId_idx" ON "RenewalReminder"("tenantId");
CREATE INDEX "FollowUp_tenantId_idx" ON "FollowUp"("tenantId");
CREATE INDEX "Reminder_tenantId_idx" ON "Reminder"("tenantId");
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX "UserSession_tenantId_idx" ON "UserSession"("tenantId");
CREATE INDEX "WorkfeedNotificationRead_tenantId_idx" ON "WorkfeedNotificationRead"("tenantId");
CREATE INDEX "NotificationEvent_tenantId_idx" ON "NotificationEvent"("tenantId");
CREATE INDEX "NotificationRecord_tenantId_idx" ON "NotificationRecord"("tenantId");
CREATE INDEX "NotificationPreference_tenantId_idx" ON "NotificationPreference"("tenantId");
CREATE INDEX "BatchTask_tenantId_idx" ON "BatchTask"("tenantId");
CREATE INDEX "LeaveRequest_tenantId_idx" ON "LeaveRequest"("tenantId");
CREATE INDEX "LeaveApprovalAction_tenantId_idx" ON "LeaveApprovalAction"("tenantId");
CREATE INDEX "AdministrativeRequest_tenantId_idx" ON "AdministrativeRequest"("tenantId");
CREATE INDEX "AdministrativeRequestAction_tenantId_idx" ON "AdministrativeRequestAction"("tenantId");
CREATE INDEX "WorkflowTemplate_tenantId_idx" ON "WorkflowTemplate"("tenantId");
CREATE INDEX "WorkflowTemplateNode_tenantId_idx" ON "WorkflowTemplateNode"("tenantId");
CREATE INDEX "WorkflowInstance_tenantId_idx" ON "WorkflowInstance"("tenantId");
CREATE INDEX "WorkflowTask_tenantId_idx" ON "WorkflowTask"("tenantId");
CREATE INDEX "WorkflowAction_tenantId_idx" ON "WorkflowAction"("tenantId");
CREATE INDEX "WorkflowCcRecipient_tenantId_idx" ON "WorkflowCcRecipient"("tenantId");
CREATE INDEX "Announcement_tenantId_idx" ON "Announcement"("tenantId");
CREATE INDEX "DictionaryEntry_tenantId_idx" ON "DictionaryEntry"("tenantId");
CREATE INDEX "Attachment_tenantId_idx" ON "Attachment"("tenantId");

ALTER TABLE "Department"
  ADD CONSTRAINT "Department_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User"
  ADD CONSTRAINT "User_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Role"
  ADD CONSTRAINT "Role_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerTag"
  ADD CONSTRAINT "CustomerTag_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpportunityStageHistory"
  ADD CONSTRAINT "OpportunityStageHistory_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quote"
  ADD CONSTRAINT "Quote_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract"
  ADD CONSTRAINT "Contract_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentPlan"
  ADD CONSTRAINT "PaymentPlan_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord"
  ADD CONSTRAINT "PaymentRecord_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RenewalReminder"
  ADD CONSTRAINT "RenewalReminder_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FollowUp"
  ADD CONSTRAINT "FollowUp_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reminder"
  ADD CONSTRAINT "Reminder_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserSession"
  ADD CONSTRAINT "UserSession_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkfeedNotificationRead"
  ADD CONSTRAINT "WorkfeedNotificationRead_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationEvent"
  ADD CONSTRAINT "NotificationEvent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationRecord"
  ADD CONSTRAINT "NotificationRecord_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference"
  ADD CONSTRAINT "NotificationPreference_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BatchTask"
  ADD CONSTRAINT "BatchTask_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeaveRequest"
  ADD CONSTRAINT "LeaveRequest_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeaveApprovalAction"
  ADD CONSTRAINT "LeaveApprovalAction_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdministrativeRequest"
  ADD CONSTRAINT "AdministrativeRequest_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdministrativeRequestAction"
  ADD CONSTRAINT "AdministrativeRequestAction_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowTemplate"
  ADD CONSTRAINT "WorkflowTemplate_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowTemplateNode"
  ADD CONSTRAINT "WorkflowTemplateNode_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowInstance"
  ADD CONSTRAINT "WorkflowInstance_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowTask"
  ADD CONSTRAINT "WorkflowTask_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowAction"
  ADD CONSTRAINT "WorkflowAction_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowCcRecipient"
  ADD CONSTRAINT "WorkflowCcRecipient_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Announcement"
  ADD CONSTRAINT "Announcement_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DictionaryEntry"
  ADD CONSTRAINT "DictionaryEntry_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
