-- Resultado manual (90 min) en eliminatorias: el sync no lo sobrescribe
ALTER TABLE "Match" ADD COLUMN "manualResult" BOOLEAN NOT NULL DEFAULT false;
