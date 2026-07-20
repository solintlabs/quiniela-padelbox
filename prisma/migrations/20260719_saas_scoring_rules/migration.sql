-- Puntuacion configurable por el organizador.
--
-- Solo columnas nuevas en SaasCompetition, todas con DEFAULT 0: una
-- competicion existente sigue puntuando exactamente igual que antes (3/1).
--
-- Se omite deliberadamente el
--   ALTER TABLE "KnockoutNotice" ALTER COLUMN "updatedAt" DROP DEFAULT;
-- que `migrate diff` vuelve a incluir: es drift preexistente de PADELBOX,
-- ajeno a este cambio. Ver la nota en 20260719_add_saas_core.

-- AlterTable
ALTER TABLE "SaasCompetition" ADD COLUMN     "pointsDrawBonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointsGoalDiff" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointsTeamScore" INTEGER NOT NULL DEFAULT 0;
