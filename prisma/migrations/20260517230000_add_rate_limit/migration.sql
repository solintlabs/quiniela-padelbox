-- Rate limiting via Prisma (DB-backed). Buckets por key + windowEnd.
-- TTL: el cron diario borra registros con windowEnd < now()-1h.
CREATE TABLE "RateLimit" (
  "key"       TEXT NOT NULL,
  "count"     INTEGER NOT NULL DEFAULT 0,
  "windowEnd" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimit_windowEnd_idx" ON "RateLimit"("windowEnd");
