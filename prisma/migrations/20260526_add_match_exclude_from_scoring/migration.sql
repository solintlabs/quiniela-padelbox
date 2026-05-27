-- Resetear puntuaciones antes del Mundial
ALTER TABLE "Match" ADD COLUMN "excludeFromScoring" BOOLEAN NOT NULL DEFAULT false;