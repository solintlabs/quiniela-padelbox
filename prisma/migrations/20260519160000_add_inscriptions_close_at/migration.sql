-- Fecha y hora del cierre de inscripciones (NUEVOS registros + activacion pago).
-- Si es NULL, las inscripciones quedan abiertas para siempre.
ALTER TABLE "Rules" ADD COLUMN "inscriptionsCloseAt" TIMESTAMP(3);
