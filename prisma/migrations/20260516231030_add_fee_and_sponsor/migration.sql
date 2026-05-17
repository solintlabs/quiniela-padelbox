ALTER TABLE "Rules" ADD COLUMN "feeAmount" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Rules" ADD COLUMN "feeCurrency" TEXT NOT NULL DEFAULT 'USD';

CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "url" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Sponsor_tenantId_enabled_sortOrder_idx" ON "Sponsor"("tenantId", "enabled", "sortOrder");
