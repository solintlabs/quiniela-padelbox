-- Equipo campeón del torneo (lo fija el organizador al terminar).
ALTER TABLE "SaasCompetition" ADD COLUMN "championWinnerTeamId" TEXT;

-- Pick de campeón por jugador y competición.
CREATE TABLE "SaasChampionPick" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SaasChampionPick_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SaasChampionPick_membershipId_competitionId_key" ON "SaasChampionPick"("membershipId", "competitionId");
CREATE INDEX "SaasChampionPick_competitionId_idx" ON "SaasChampionPick"("competitionId");

ALTER TABLE "SaasChampionPick" ADD CONSTRAINT "SaasChampionPick_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "SaasMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaasChampionPick" ADD CONSTRAINT "SaasChampionPick_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "SaasCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaasChampionPick" ADD CONSTRAINT "SaasChampionPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SaasTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
