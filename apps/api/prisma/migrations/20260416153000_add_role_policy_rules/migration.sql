ALTER TABLE "Role"
ADD COLUMN "extendedDataScopes" JSONB,
ADD COLUMN "fieldPermissionRules" JSONB,
ADD COLUMN "actionPermissionRules" JSONB;
