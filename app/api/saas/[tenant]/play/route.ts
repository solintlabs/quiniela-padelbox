import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { competitionScope, fixtureScope } from '@/lib/saas/scope';
import { describeRules, rulesOf, lockTimeFor } from '@/lib/saas/scoring';
import { computeCompetitionRanking } from '@/lib/saas/ranking';
import { hasAtLeastRole } from '@/lib/saas/roles';

/**
 * GET /api/saas/[tenant]/play
 *
 * Payload completo del jugador para el cliente móvil: marca del tenant, reglas,
 * competición activa con los partidos (y mi pronóstico), clasificación y el pick
 * de campeón. Una sola llamada = una pantalla. Autenticado por el MISMO JWT que
 * ya usa la app (requireTenantRoleApi → requireUserApi acepta el Bearer).
 */
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'PLAYER', req);
  if (ctx instanceof Response) return ctx;
  const { tenant, membership } = ctx;

  const brand = {
    slug: tenant.slug,
    name: tenant.name,
    accentColor: tenant.accentColor,
    logoUrl: tenant.logoUrl,
    plan: tenant.plan,
    prizesText: tenant.prizesText,
    rulesText: tenant.rulesText,
    entryFee: tenant.entryFee,
    paymentInfo: tenant.paymentInfo,
  };
  const me = {
    role: membership.role,
    hasPaid: membership.hasPaid,
    // Para la pestaña "Mi perfil" del móvil: su membresía y su nombre aquí.
    membershipId: membership.id,
    displayName: membership.displayName,
  };
  const canPredict = membership.hasPaid || hasAtLeastRole(membership.role, 'ADMIN');

  // Cómo se paga el bote: la app lo muestra en Reglas, igual que la web.
  const methodRows = await prisma.paymentMethod.findMany({
    where: { tenantId: tenant.id, enabled: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, title: true, subtitle: true, icon: true, fields: true },
  });
  const paymentMethods = methodRows.map((m) => ({
    id: m.id,
    title: m.title,
    subtitle: m.subtitle,
    icon: m.icon,
    fields: Array.isArray(m.fields) ? (m.fields as Array<{ label: string; value: string }>) : [],
  }));

  const competition = await prisma.saasCompetition.findFirst({
    where: competitionScope(tenant.id, { status: { in: ['OPEN', 'LOCKED', 'FINISHED'] } }),
    orderBy: { createdAt: 'desc' },
  });

  if (!competition) {
    return Response.json({ tenant: brand, me, canPredict, paymentMethods, competition: null });
  }

  const now = new Date();
  const [fixtures, ranking, champTeams, myPick, firstFixture] = await Promise.all([
    prisma.saasFixture.findMany({
      where: fixtureScope(tenant.id, {
        competitionId: competition.id,
        kickoff: { gte: new Date(now.getTime() - 3 * 86_400_000) },
      }),
      orderBy: { kickoff: 'asc' },
      take: 30,
      include: { homeTeam: true, awayTeam: true },
    }),
    computeCompetitionRanking(tenant.id, competition.id),
    prisma.saasTeam.findMany({
      where: { competitionId: competition.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true },
    }),
    prisma.saasChampionPick.findFirst({
      where: { membershipId: membership.id, competitionId: competition.id },
      select: { teamId: true },
    }),
    prisma.saasFixture.findFirst({
      where: { competitionId: competition.id },
      orderBy: { kickoff: 'asc' },
      select: { kickoff: true },
    }),
  ]);

  const myEntries = await prisma.saasEntry.findMany({
    where: { membershipId: membership.id, fixtureId: { in: fixtures.map((f) => f.id) } },
    select: { fixtureId: true, homeScore: true, awayScore: true, points: true },
  });
  const entryByFixture = new Map(myEntries.map((e) => [e.fixtureId, e]));

  const fixtureVMs = fixtures.map((f) => {
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
      kickoff: f.kickoff.toISOString(),
      round: f.round,
      closed,
      homeScore: f.homeScore,
      awayScore: f.awayScore,
      myHome: e?.homeScore ?? null,
      myAway: e?.awayScore ?? null,
      points: e?.points ?? null,
    };
  });

  const championLocked = !!firstFixture && firstFixture.kickoff.getTime() <= now.getTime();

  return Response.json({
    tenant: brand,
    me,
    canPredict,
    paymentMethods,
    competition: {
      id: competition.id,
      name: competition.name,
      status: competition.status,
      pointsSummary: describeRules(rulesOf(competition)),
      pointsBonus: competition.pointsBonus,
      // Para la pestaña Admin del móvil: controles rápidos del organizador.
      lockOffsetMin: competition.lockOffsetMin,
      showTrendPreClose: competition.showTrendPreClose,
    },
    fixtures: fixtureVMs,
    ranking: ranking.map((r) => ({
      membershipId: r.membershipId,
      position: r.position,
      displayName: r.displayName || 'Jugador',
      points: r.points,
      exact: r.exact,
      isMe: r.membershipId === membership.id,
      champion: r.champion,
    })),
    champion:
      champTeams.length >= 2 && competition.pointsBonus > 0
        ? {
            bonus: competition.pointsBonus,
            teams: champTeams,
            myTeamId: myPick?.teamId ?? null,
            locked: championLocked,
            winnerTeamId: competition.championWinnerTeamId,
          }
        : null,
  });
}
