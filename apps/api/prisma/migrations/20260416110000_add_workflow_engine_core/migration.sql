CREATE TYPE "WorkflowTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED');
CREATE TYPE "WorkflowNodeType" AS ENUM ('APPROVAL', 'NOTICE');
CREATE TYPE "WorkflowAssignmentType" AS ENUM ('USER', 'PERMISSION', 'INITIATOR');
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED', 'TERMINATED');
CREATE TYPE "WorkflowTaskStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'TRANSFERRED', 'CANCELLED');
CREATE TYPE "WorkflowActionType" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CC', 'ADDED_SIGN', 'TRANSFERRED', 'CANCELLED', 'TERMINATED');

CREATE TABLE "WorkflowTemplate" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "businessType" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "WorkflowTemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "formSchema" JSONB NOT NULL,
  "defaultCcUserIds" JSONB,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowTemplateNode" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "nodeKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nodeType" "WorkflowNodeType" NOT NULL DEFAULT 'APPROVAL',
  "position" INTEGER NOT NULL,
  "assignmentType" "WorkflowAssignmentType" NOT NULL,
  "assignmentConfig" JSONB NOT NULL,
  "branchRules" JSONB,
  "fallbackNodeKey" TEXT,
  "allowAddSign" BOOLEAN NOT NULL DEFAULT true,
  "allowTransfer" BOOLEAN NOT NULL DEFAULT true,
  "ccUserIds" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkflowTemplateNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowInstance" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "businessKey" TEXT,
  "title" TEXT NOT NULL,
  "formData" JSONB NOT NULL,
  "currentNodeKey" TEXT,
  "status" "WorkflowInstanceStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowTask" (
  "id" TEXT NOT NULL,
  "instanceId" TEXT NOT NULL,
  "templateNodeId" TEXT,
  "nodeKey" TEXT NOT NULL,
  "nodeName" TEXT NOT NULL,
  "assigneeId" TEXT NOT NULL,
  "createdById" TEXT,
  "sourceTaskId" TEXT,
  "isAddSign" BOOLEAN NOT NULL DEFAULT false,
  "status" "WorkflowTaskStatus" NOT NULL DEFAULT 'PENDING',
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowAction" (
  "id" TEXT NOT NULL,
  "instanceId" TEXT NOT NULL,
  "taskId" TEXT,
  "actorId" TEXT NOT NULL,
  "actionType" "WorkflowActionType" NOT NULL,
  "comment" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkflowAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowCcRecipient" (
  "id" TEXT NOT NULL,
  "instanceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "sourceNodeKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkflowCcRecipient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowTemplate_key_key" ON "WorkflowTemplate"("key");
CREATE INDEX "WorkflowTemplate_businessType_status_idx" ON "WorkflowTemplate"("businessType", "status");

CREATE UNIQUE INDEX "WorkflowTemplateNode_templateId_nodeKey_key" ON "WorkflowTemplateNode"("templateId", "nodeKey");
CREATE UNIQUE INDEX "WorkflowTemplateNode_templateId_position_key" ON "WorkflowTemplateNode"("templateId", "position");
CREATE INDEX "WorkflowTemplateNode_templateId_position_idx" ON "WorkflowTemplateNode"("templateId", "position");

CREATE INDEX "WorkflowInstance_templateId_status_idx" ON "WorkflowInstance"("templateId", "status");
CREATE INDEX "WorkflowInstance_applicantId_submittedAt_idx" ON "WorkflowInstance"("applicantId", "submittedAt");
CREATE INDEX "WorkflowInstance_status_submittedAt_idx" ON "WorkflowInstance"("status", "submittedAt");

CREATE INDEX "WorkflowTask_instanceId_nodeKey_status_idx" ON "WorkflowTask"("instanceId", "nodeKey", "status");
CREATE INDEX "WorkflowTask_assigneeId_status_createdAt_idx" ON "WorkflowTask"("assigneeId", "status", "createdAt");
CREATE INDEX "WorkflowTask_templateNodeId_idx" ON "WorkflowTask"("templateNodeId");
CREATE INDEX "WorkflowTask_sourceTaskId_idx" ON "WorkflowTask"("sourceTaskId");

CREATE INDEX "WorkflowAction_instanceId_createdAt_idx" ON "WorkflowAction"("instanceId", "createdAt");
CREATE INDEX "WorkflowAction_actorId_createdAt_idx" ON "WorkflowAction"("actorId", "createdAt");
CREATE INDEX "WorkflowAction_taskId_idx" ON "WorkflowAction"("taskId");

CREATE UNIQUE INDEX "WorkflowCcRecipient_instanceId_userId_sourceNodeKey_key" ON "WorkflowCcRecipient"("instanceId", "userId", "sourceNodeKey");
CREATE INDEX "WorkflowCcRecipient_userId_createdAt_idx" ON "WorkflowCcRecipient"("userId", "createdAt");

ALTER TABLE "WorkflowTemplate"
ADD CONSTRAINT "WorkflowTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowTemplate"
ADD CONSTRAINT "WorkflowTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowTemplateNode"
ADD CONSTRAINT "WorkflowTemplateNode_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowInstance"
ADD CONSTRAINT "WorkflowInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowInstance"
ADD CONSTRAINT "WorkflowInstance_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowTask"
ADD CONSTRAINT "WorkflowTask_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowTask"
ADD CONSTRAINT "WorkflowTask_templateNodeId_fkey" FOREIGN KEY ("templateNodeId") REFERENCES "WorkflowTemplateNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkflowTask"
ADD CONSTRAINT "WorkflowTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowTask"
ADD CONSTRAINT "WorkflowTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkflowTask"
ADD CONSTRAINT "WorkflowTask_sourceTaskId_fkey" FOREIGN KEY ("sourceTaskId") REFERENCES "WorkflowTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkflowAction"
ADD CONSTRAINT "WorkflowAction_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowAction"
ADD CONSTRAINT "WorkflowAction_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkflowTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkflowAction"
ADD CONSTRAINT "WorkflowAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowCcRecipient"
ADD CONSTRAINT "WorkflowCcRecipient_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowCcRecipient"
ADD CONSTRAINT "WorkflowCcRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowCcRecipient"
ADD CONSTRAINT "WorkflowCcRecipient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
