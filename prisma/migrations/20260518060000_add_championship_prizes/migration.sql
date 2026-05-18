-- Premios del campeonato completo (texto libre, editado desde admin)
-- Si vacio, la app muestra texto generico tipo "Premio del podio"
ALTER TABLE "Rules"
ADD COLUMN "championPrizesText" TEXT;
