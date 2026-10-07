-- Fase 1 del SaaS multi-tenant.
--
-- SQL revisado a mano. Contiene EXCLUSIVAMENTE:
--   * CREATE TYPE / CREATE TABLE / CREATE INDEX de tablas nuevas con prefijo Saas
--   * las FK entre esas tablas nuevas y hacia Tenant (tabla de scaffolding, vacia)
--   * una columna nueva en Tenant (defaultLocale), tabla sin filas ni lectores
--
-- NO toca User, Match, Prediction, Rules, Sponsor, PaymentMethod, PushDevice,
-- GiftCard, WeeklyPrize, PredictionLog, KnockoutNotice ni RateLimit.
--
-- Nota: `prisma migrate diff` incluia ademas
--   ALTER TABLE "KnockoutNotice" ALTER COLUMN "updatedAt" DROP DEFAULT;
-- Es drift preexistente (la migracion 20260623_add_knockout_notice se escribio
-- a mano con DEFAULT CURRENT_TIMESTAMP y el modelo declara @updatedAt sin
-- default). No tiene relacion con el SaaS y toca una tabla viva del sistema de
-- avisos push, asi que se ha eliminado deliberadamente de esta migracion.

-- CreateEnum
CREATE TYPE "SaasRole" AS ENUM ('OWNER', 'ADMIN', 'PLAYER');

-- CreateEnum
CREATE TYPE "SaasProvider" AS ENUM ('ESPN', 'MANUAL');

-- CreateEnum
CREATE TYPE "SaasCompetitionFormat" AS ENUM ('LEAGUE', 'GROUPS_KO', 'KO', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SaasCompetitionStatus" AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'FINISHED');

-- CreateEnum
CREATE TYPE "SaasFixtureStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED');


-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "defaultLocale" TEXT NOT NULL DEFAULT 'es';

-- CreateTable
CREATE TABLE "SaasMembership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SaasRole" NOT NULL DEFAULT 'PLAYER',
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paidNote" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaasMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaasCompetition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL DEFAULT 'soccer',
    "provider" "SaasProvider" NOT NULL DEFAULT 'MANUAL',
    "espnSlug" TEXT,
    "season" TEXT,
    "format" "SaasCompetitionFormat" NOT NULL DEFAULT 'LEAGUE',
    "status" "SaasCompetitionStatus" NOT NULL DEFAULT 'DRAFT',
    "pointsExact" INTEGER NOT NULL DEFAULT 3,
    "pointsWinner" INTEGER NOT NULL DEFAULT 1,
    "pointsBonus" INTEGER NOT NULL DEFAULT 0,
    "lockOffsetMin" INTEGER NOT NULL DEFAULT 15,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaasCompetition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaasTeam" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "logoUrl" TEXT,
    "espnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaasTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaasFixture" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "round" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" "SaasFixtureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "lockedAt" TIMESTAMP(3),
    "scoredAt" TIMESTAMP(3),
    "source" "SaasProvider" NOT NULL DEFAULT 'MANUAL',
    "externalId" TEXT,
    "manualResult" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaasFixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaasEntry" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "points" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaasEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaasMembership_userId_idx" ON "SaasMembership"("userId");

-- CreateIndex
CREATE INDEX "SaasMembership_tenantId_role_idx" ON "SaasMembership"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "SaasMembership_tenantId_userId_key" ON "SaasMembership"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "SaasCompetition_tenantId_status_idx" ON "SaasCompetition"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SaasCompetition_status_provider_idx" ON "SaasCompetition"("status", "provider");

-- CreateIndex
CREATE INDEX "SaasTeam_competitionId_idx" ON "SaasTeam"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "SaasTeam_competitionId_name_key" ON "SaasTeam"("competitionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SaasTeam_competitionId_espnId_key" ON "SaasTeam"("competitionId", "espnId");

-- CreateIndex
CREATE INDEX "SaasFixture_competitionId_kickoff_idx" ON "SaasFixture"("competitionId", "kickoff");

-- CreateIndex
CREATE INDEX "SaasFixture_status_idx" ON "SaasFixture"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SaasFixture_competitionId_externalId_key" ON "SaasFixture"("competitionId", "externalId");

-- CreateIndex
CREATE INDEX "SaasEntry_fixtureId_idx" ON "SaasEntry"("fixtureId");

-- CreateIndex
CREATE UNIQUE INDEX "SaasEntry_membershipId_fixtureId_key" ON "SaasEntry"("membershipId", "fixtureId");

-- AddForeignKey
ALTER TABLE "SaasMembership" ADD CONSTRAINT "SaasMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasCompetition" ADD CONSTRAINT "SaasCompetition_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasTeam" ADD CONSTRAINT "SaasTeam_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "SaasCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasFixture" ADD CONSTRAINT "SaasFixture_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "SaasCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasFixture" ADD CONSTRAINT "SaasFixture_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "SaasTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasFixture" ADD CONSTRAINT "SaasFixture_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "SaasTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasEntry" ADD CONSTRAINT "SaasEntry_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "SaasMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasEntry" ADD CONSTRAINT "SaasEntry_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "SaasFixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

