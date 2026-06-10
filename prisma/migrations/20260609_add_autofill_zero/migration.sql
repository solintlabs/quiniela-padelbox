-- Red de seguridad: auto-rellenar 0-0 al cerrar partidos
ALTER TABLE "Rules" ADD COLUMN "autofillZeroOnLock" BOOLEAN NOT NULL DEFAULT false;
