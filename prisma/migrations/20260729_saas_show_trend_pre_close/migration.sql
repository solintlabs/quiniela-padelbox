-- El organizador decide si la tendencia 1X2 (% de pronósticos) se muestra
-- antes del cierre del partido. Additiva y con default: cero riesgo.
ALTER TABLE "SaasCompetition" ADD COLUMN "showTrendPreClose" BOOLEAN NOT NULL DEFAULT false;
