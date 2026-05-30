-- Toggle admin para ocultar ranking publico cuando hay poca gente inscrita
ALTER TABLE "Rules" ADD COLUMN "rankingHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Rules" ADD COLUMN "rankingHiddenText" TEXT;