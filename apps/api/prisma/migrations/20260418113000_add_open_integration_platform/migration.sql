ALTER TYPE "AuditActionType" ADD VALUE IF NOT EXISTS 'ACCESS';
ALTER TYPE "AuditActionType" ADD VALUE IF NOT EXISTS 'ACCESS_DENIED';
ALTER TYPE "AuditActionType" ADD VALUE IF NOT EXISTS 'WEBHOOK_DELIVERY';
ALTER TYPE "AuditActionType" ADD VALUE IF NOT EXISTS 'WEBHOOK_DELIVERY_FAILED';

CREATE TYPE "OpenApiCredentialStatus" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "WebhookSubscriptionStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "IdentityConnectorType" AS ENUM ('SSO', 'LDAP', 'OAUTH');
CREATE TYPE "IdentityConnectorMatchField" AS ENUM ('USERNAME', 'EMAIL');

CREATE TABLE "OpenApiCredential" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "accessKey" TEXT NOT NULL,
  "secretHash" TEXT NOT NULL,
  "scopes" JSONB NOT NULL,
  "status" "OpenApiCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "rotatedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OpenApiCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookSubscription" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "endpointUrl" TEXT NOT NULL,
  "eventTypes" JSONB NOT NULL,
  "status" "WebhookSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "signingSecret" TEXT NOT NULL,
  "signingSecretHint" TEXT NOT NULL,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "timeoutSeconds" INTEGER NOT NULL DEFAULT 10,
  "lastTriggeredAt" TIMESTAMP(3),
  "lastDeliveryStatus" "WebhookDeliveryStatus",
  "lastFailureMessage" TEXT,
  "createdByName" TEXT,
  "updatedByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookDelivery" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "signature" TEXT NOT NULL,
  "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "responseStatusCode" INTEGER,
  "responseBody" TEXT,
  "errorMessage" TEXT,
  "nextRetryAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdentityConnector" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "IdentityConnectorType" NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "matchField" "IdentityConnectorMatchField" NOT NULL DEFAULT 'EMAIL',
  "issuerUrl" TEXT,
  "authorizeUrl" TEXT,
  "tokenUrl" TEXT,
  "directoryUrl" TEXT,
  "clientId" TEXT,
  "clientSecretHash" TEXT,
  "clientSecretHint" TEXT,
  "allowedDomains" JSONB,
  "config" JSONB,
  "lastAuthenticatedAt" TIMESTAMP(3),
  "lastFailureAt" TIMESTAMP(3),
  "lastFailureMessage" TEXT,
  "createdByName" TEXT,
  "updatedByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IdentityConnector_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdentityConnectorBinding" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "connectorId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "externalSubject" TEXT NOT NULL,
  "externalUsername" TEXT,
  "externalEmail" TEXT,
  "lastAuthenticatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IdentityConnectorBinding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpenApiCredential_accessKey_key" ON "OpenApiCredential"("accessKey");
CREATE INDEX "OpenApiCredential_tenantId_idx" ON "OpenApiCredential"("tenantId");
CREATE INDEX "OpenApiCredential_status_createdAt_idx" ON "OpenApiCredential"("status", "createdAt");

CREATE INDEX "WebhookSubscription_tenantId_idx" ON "WebhookSubscription"("tenantId");
CREATE INDEX "WebhookSubscription_status_createdAt_idx" ON "WebhookSubscription"("status", "createdAt");

CREATE INDEX "WebhookDelivery_tenantId_idx" ON "WebhookDelivery"("tenantId");
CREATE INDEX "WebhookDelivery_subscriptionId_createdAt_idx" ON "WebhookDelivery"("subscriptionId", "createdAt");
CREATE INDEX "WebhookDelivery_status_createdAt_idx" ON "WebhookDelivery"("status", "createdAt");

CREATE INDEX "IdentityConnector_tenantId_idx" ON "IdentityConnector"("tenantId");
CREATE INDEX "IdentityConnector_status_type_idx" ON "IdentityConnector"("status", "type");

CREATE UNIQUE INDEX "IdentityConnectorBinding_connectorId_externalSubject_key" ON "IdentityConnectorBinding"("connectorId", "externalSubject");
CREATE INDEX "IdentityConnectorBinding_tenantId_idx" ON "IdentityConnectorBinding"("tenantId");
CREATE INDEX "IdentityConnectorBinding_userId_idx" ON "IdentityConnectorBinding"("userId");

ALTER TABLE "OpenApiCredential"
  ADD CONSTRAINT "OpenApiCredential_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WebhookSubscription"
  ADD CONSTRAINT "WebhookSubscription_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WebhookDelivery"
  ADD CONSTRAINT "WebhookDelivery_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WebhookDelivery"
  ADD CONSTRAINT "WebhookDelivery_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IdentityConnector"
  ADD CONSTRAINT "IdentityConnector_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "IdentityConnectorBinding"
  ADD CONSTRAINT "IdentityConnectorBinding_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "IdentityConnectorBinding"
  ADD CONSTRAINT "IdentityConnectorBinding_connectorId_fkey"
  FOREIGN KEY ("connectorId") REFERENCES "IdentityConnector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IdentityConnectorBinding"
  ADD CONSTRAINT "IdentityConnectorBinding_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
