CREATE TABLE "PredictionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "prevHome" INTEGER,
    "prevAway" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PredictionLog_createdAt_idx" ON "PredictionLog"("createdAt");
CREATE INDEX "PredictionLog_userId_createdAt_idx" ON "PredictionLog"("userId", "createdAt");
CREATE INDEX "PredictionLog_matchId_createdAt_idx" ON "PredictionLog"("matchId", "createdAt");

ALTER TABLE "PredictionLog" ADD CONSTRAINT "PredictionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PredictionLog" ADD CONSTRAINT "PredictionLog_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
