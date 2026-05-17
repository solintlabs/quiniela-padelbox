-- Campeón ganador del Mundial (lo setea el admin tras la final)
-- Usado para otorgar bonus +pointsChampion en el ranking final
ALTER TABLE "Rules"
ADD COLUMN "championWinner" TEXT;
