-- Rename apiFootballId to externalId (provider-agnostic naming)
ALTER TABLE "Match" RENAME COLUMN "apiFootballId" TO "externalId";
ALTER INDEX "Match_apiFootballId_key" RENAME TO "Match_externalId_key";
