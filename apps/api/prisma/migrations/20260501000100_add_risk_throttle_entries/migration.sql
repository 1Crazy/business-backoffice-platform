CREATE TABLE "RiskThrottleEntry" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "firstAttemptAt" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskThrottleEntry_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RiskThrottleEntry_lockedUntil_idx" ON "RiskThrottleEntry"("lockedUntil");
