-- Marca del recordatorio enviado, para no repetirlo entre pasadas del cron.
ALTER TABLE "SaasFixture" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
