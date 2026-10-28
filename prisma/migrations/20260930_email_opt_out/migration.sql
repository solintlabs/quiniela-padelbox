-- Baja de correos no imprescindibles (recordatorios, avisos, promociones).
ALTER TABLE "User" ADD COLUMN "emailOptOut" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailOptOutAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "unsubToken" TEXT;
CREATE UNIQUE INDEX "User_unsubToken_key" ON "User"("unsubToken");

-- Un solo recordatorio por persona (no uno por tanda de partidos).
ALTER TABLE "SaasMembership" ADD COLUMN "lastRemindedAt" TIMESTAMP(3);
