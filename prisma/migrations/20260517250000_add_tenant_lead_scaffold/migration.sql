-- SaaS multi-tenant SCAFFOLD: Tenant + Lead. Sin FKs a tablas existentes
-- para no afectar al flow actual de PADELBOX.

CREATE TYPE "TenantStatus" AS ENUM ('LEAD', 'TRIAL', 'ACTIVE', 'PAYMENT_FAILED', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "TenantPlan" AS ENUM ('FREE', 'PRO', 'CUSTOM');

CREATE TABLE "Tenant" (
  "id"               TEXT NOT NULL,
  "slug"             TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "adminEmail"       TEXT NOT NULL,
  "adminPhone"       TEXT,
  "logoUrl"          TEXT,
  "accentColor"      TEXT NOT NULL DEFAULT '#B6FF3C',
  "contactWhatsapp"  TEXT,
  "status"           "TenantStatus" NOT NULL DEFAULT 'LEAD',
  "plan"             "TenantPlan" NOT NULL DEFAULT 'FREE',
  "trialEndsAt"      TIMESTAMP(3),
  "stripeCustomerId" TEXT,
  "stripeSubId"      TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

CREATE TABLE "Lead" (
  "id"           TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "name"         TEXT,
  "clubName"     TEXT,
  "phone"        TEXT,
  "expectedSize" INTEGER,
  "source"       TEXT,
  "notes"        TEXT,
  "contacted"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_contacted_createdAt_idx" ON "Lead"("contacted", "createdAt");
