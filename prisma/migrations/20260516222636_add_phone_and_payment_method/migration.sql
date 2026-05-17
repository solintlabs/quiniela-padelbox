-- Añadir phone al User
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Nuevo modelo PaymentMethod
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "icon" TEXT,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentMethod_tenantId_enabled_sortOrder_idx" ON "PaymentMethod"("tenantId", "enabled", "sortOrder");
