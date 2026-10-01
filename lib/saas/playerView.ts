import { prisma } from '@/lib/db';
import { requireTenantRolePage } from '@/lib/saas/permissions';
import { competitionScope, fixtureScope } from '@/lib/saas/scope';
import { lockTimeFor } from '@/lib/saas/scoring';
import { computeCompetitionRanking } from '@/lib/saas/ranking';
import { hasAtLeastRole } from '@/lib/saas/roles';
import { formatDateTime } from '@/lib/format';
import type { Tenant, SaasCompetition } from '@prisma/client';
import type { FixtureVM } from '@/app/saas/[tenant]/TenantFixtures';

/**
 * Cargadores compartidos por las pantallas del jugador (inicio, partidos,
 * ranking, reglas). Cada pantalla pide solo lo que necesita, todo scopeado al
 * tenant. Vive aquí para no duplicar las consultas en cada page.
 */

export interface TenantPlayerCtx {
  tenant: Tenant;
  membershipId: string;
  isAdmin: boolean;
  hasPaid: boolean;
  canPredict: boolean;
}

/** Resuelve tenant + membresía y los permisos básicos del jugador. */
export async function loadTenantPlayer(slug: string): Promise<TenantPlayerCtx> {
  const ctx = await requireTenantRolePage(slug, 'PLAYER');
  const isAdmin = hasAtLeastRole(ctx.membership.role, 'ADMIN');
  return {
    tenant: ctx.tenant,
    membershipId: ctx.membership.id,
    isAdmin,
    hasPaid: ctx.membership.hasPaid,
    // El organizador siempre pronostica; el jugador cuando le confirman el pago.
    canPredict: ctx.membership.hasPaid || isAdmin,
  };
}

/** La competición activa (la más reciente abierta/cerrada/terminada). */
export async function loadActiveCompetition(tenantId: string): Promise<SaasCompetition | null> {
  return prisma.saasCompetition.findFirst({
    where: competitionScope(tenantId, { status: { in: ['OPEN', 'LOCKED', 'FINISHED'] } }),
    orderBy: { createdAt: 'desc' },
  });
}

/** Partidos de la competición con mi pronóstico, ya en forma de VM para la UI. */
export async function loadFixtureVMs(
  tenantId: string,
  competition: SaasCompetition,
  membershipId: string,
  take: number,
): Promise<FixtureVM[]> {
  const now = new Date();
  const fixtures = await prisma.saasFixture.findMany({
    where: fixtureScope(tenantId, {
      competitionId: competition.id,
      kickoff: { gte: new Date(now.getTime() - 3 * 86_400_000) },
    }),
    orderBy: { kickoff: 'asc' },
    take,
    include: { homeTeam: true, awayTeam: true },
  });

  const myEntries = await prisma.saasEntry.findMany({
    where: { membershipId, fixtureId: { in: fixtures.map((f) => f.id) } },
    select: { fixtureId: true, homeScore: true, awayScore: true, points: true },
  });
  const entryByFixture = new Map(myEntries.map((e) => [e.fixtureId, e]));

  return fixtures.map((f) => {
    const closed =
      f.lockedAt !== null ||
      lockTimeFor(f.kickoff, competition.lockOffsetMin).getTime() <= now.getTime();
    const e = entryByFixture.get(f.id);
    return {
      id: f.id,
      home: f.homeTeam.name,
      away: f.awayTeam.name,
      homeLogo: f.homeTeam.logoUrl,
      awayLogo: f.awayTeam.logoUrl,
      kickoff: formatDateTime(f.kickoff),
      round: f.round,
      closed,
      homeScore: f.homeScore,
      awayScore: f.awayScore,
      myHome: e?.homeScore ?? null,
      myAway: e?.awayScore ?? null,
      points: e?.points ?? null,
    };
  });
}

/** Clasificación completa de la competición. */
export async function loadRanking(tenantId: string, competitionId: string) {
  return computeCompetitionRanking(tenantId, competitionId);
}

/** Datos del pick de campeón (equipos, mi pick, si está cerrado). */
export async function loadChampionData(competition: SaasCompetition, membershipId: string) {
  const [teams, myPick, firstFixture] = await Promise.all([
    prisma.saasTeam.findMany({
      where: { competitionId: competition.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true },
    }),
    prisma.saasChampionPick.findFirst({
      where: { membershipId, competitionId: competition.id },
      select: { teamId: true },
    }),
    prisma.saasFixture.findFirst({
      where: { competitionId: competition.id },
      orderBy: { kickoff: 'asc' },
      select: { kickoff: true },
    }),
  ]);
  const locked = !!firstFixture && firstFixture.kickoff.getTime() <= Date.now();
  return { teams, myTeamId: myPick?.teamId ?? null, locked };
}
