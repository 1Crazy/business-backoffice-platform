ALTER TABLE "OpenApiCredential"
  ADD COLUMN "secretHashVersion" TEXT NOT NULL DEFAULT 'sha256';

ALTER TABLE "WebhookSubscription"
  ADD COLUMN "signingSecretCiphertext" TEXT,
  ADD COLUMN "signingSecretVersion" TEXT NOT NULL DEFAULT 'plain';

ALTER TABLE "IdentityConnector"
  ADD COLUMN "clientSecretHashVersion" TEXT;
