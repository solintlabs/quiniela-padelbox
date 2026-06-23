CREATE TABLE "KnockoutNotice" (
    "stage" TEXT NOT NULL,
    "unlockSentAt" TIMESTAMP(3),
    "lastRemindAt" TIMESTAMP(3),
    "preCloseSentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnockoutNotice_pkey" PRIMARY KEY ("stage")
);
