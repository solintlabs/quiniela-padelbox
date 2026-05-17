-- Modo manual: si syncPaused = true, syncMatchesFromApi() hace early return
-- y el admin gestiona partidos a mano sin que el cron sobreescriba.
ALTER TABLE "Rules"
ADD COLUMN "syncPaused" BOOLEAN NOT NULL DEFAULT false;
