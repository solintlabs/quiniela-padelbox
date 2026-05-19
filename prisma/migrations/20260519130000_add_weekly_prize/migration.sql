-- Premios semanales individuales (uno por semana del torneo). Reemplaza
-- el uso de Rules.weeklyPrizesText como bloque unico — ahora el admin
-- gestiona premios por semana y queda historico de ganadores.
CREATE TABLE "WeeklyPrize" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "prizeText" TEXT NOT NULL,
    "winnerUserId" TEXT,
    "awardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPrize_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeeklyPrize_weekNumber_key" ON "WeeklyPrize"("weekNumber");
