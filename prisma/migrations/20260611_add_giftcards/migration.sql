CREATE TABLE "GiftCard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "monto" TEXT NOT NULL,
    "titulo" TEXT,
    "detalle" TEXT,
    "sponsorName" TEXT,
    "winnerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "redeemedAt" TIMESTAMP(3),
    "redeemNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GiftCard_code_key" ON "GiftCard"("code");

CREATE INDEX "GiftCard_status_createdAt_idx" ON "GiftCard"("status", "createdAt");
