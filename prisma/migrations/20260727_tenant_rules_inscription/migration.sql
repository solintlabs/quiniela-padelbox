-- Reglas propias, cuota de inscripción e info de pago por tenant.
ALTER TABLE "Tenant" ADD COLUMN "rulesText" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "entryFee" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "paymentInfo" TEXT;
