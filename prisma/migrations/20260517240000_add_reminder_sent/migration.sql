-- Push reminder 1h antes del partido: marcamos cuándo se envió para evitar duplicados
ALTER TABLE "Match"
ADD COLUMN "reminderSentAt" TIMESTAMP(3);
