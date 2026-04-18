CREATE TYPE "ProductConfigLayer" AS ENUM ('PLATFORM_DEFAULT', 'INDUSTRY_TEMPLATE', 'TENANT_OVERRIDE');
CREATE TYPE "ProductConfigScope" AS ENUM ('MENU', 'FIELD_SCHEME', 'FORM_TEMPLATE', 'THEME', 'TEMPLATE');

CREATE TABLE "ProductConfig" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "tenantId" TEXT,
  "industryCode" TEXT,
  "layer" "ProductConfigLayer" NOT NULL,
  "scope" "ProductConfigScope" NOT NULL,
  "configKey" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "description" TEXT,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductConfig_code_key" ON "ProductConfig"("code");
CREATE INDEX "ProductConfig_tenantId_idx" ON "ProductConfig"("tenantId");
CREATE INDEX "ProductConfig_industryCode_idx" ON "ProductConfig"("industryCode");
CREATE INDEX "ProductConfig_layer_scope_idx" ON "ProductConfig"("layer", "scope");
CREATE INDEX "ProductConfig_configKey_idx" ON "ProductConfig"("configKey");

ALTER TABLE "ProductConfig"
ADD CONSTRAINT "ProductConfig_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
