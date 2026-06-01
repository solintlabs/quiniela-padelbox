-- Enlace de acceso permanente por usuario
ALTER TABLE "User" ADD COLUMN "accessToken" TEXT;
CREATE UNIQUE INDEX "User_accessToken_key" ON "User"("accessToken");
