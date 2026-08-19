import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { lockTimeFor } from '@/lib/saas/scoring';
import { publicDisplayName } from '@/lib/display';

/**
 * GET /api/saas/[tenant]/fixtures/[fixtureId]/entries
 *
 * Qué pronosticó cada uno en un partido, más la tendencia 1X2. Solo se revela
 * con el partido CERRADO: antes sería copiar. Es el equivalente móvil de la
 * página de detalle de la web.
 */
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { tenant: string; fixtureId: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'PLAYER', req);
  if (ctx instanceof Response) return ctx;

  const fixture = await prisma.saasFixture.findFirst({
    where: { id: params.fixtureId, competition: { tenantId: ctx.tenant.id } },
    include: {
      homeTeam: { select: { name: true, logoUrl: true } },
      awayTeam: { select: { name: true, logoUrl: true } },
      competition: { select: { lockOffsetMin: true, showTrendPreClose: true } },
    },
  });
  if (!fixture) return Response.json({ error: 'Partido no encontrado.' }, { status: 404 });

  const closed =
    fixture.lockedAt !== null ||
    lockTimeFor(fixture.kickoff, fixture.competition.lockOffsetMin).getTime() <= Date.now();

  const base = {
    fixture: {
      id: fixture.id,
      home: fixture.homeTeam.name,
      away: fixture.awayTeam.name,
      homeLogo: fixture.homeTeam.logoUrl,
      awayLogo: fixture.awayTeam.logoUrl,
      kickoff: fixture.kickoff.toISOString(),
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      closed,
    },
  };

  if (!closed) {
    // Si el organizador lo activó, la tendencia (solo %) se enseña ya antes
    // del cierre. Los marcadores individuales nunca: sería copiar.
    if (!fixture.competition.showTrendPreClose) {
      return Response.json({ ...base, revealed: false, entries: [], trend: null });
    }
    const open = await prisma.saasEntry.findMany({
      where: { fixtureId: fixture.id, membership: { tenantId: ctx.tenant.id } },
      select: { homeScore: true, awayScore: true },
    });
    const totalOpen = open.length;
    const homeOpen = open.filter((e) => e.homeScore > e.awayScore).length;
    const drawOpen = open.filter((e) => e.homeScore === e.awayScore).length;
    const pctOpen = (n: number) => (totalOpen > 0 ? Math.round((n / totalOpen) * 100) : 0);
    return Response.json({
      ...base,
      revealed: false,
      entries: [],
      trend:
        totalOpen >= 3
          ? { home: pctOpen(homeOpen), draw: pctOpen(drawOpen), away: pctOpen(totalOpen - homeOpen - drawOpen) }
          : null,
    });
  }

  const entries = await prisma.saasEntry.findMany({
    where: { fixtureId: fixture.id, membership: { tenantId: ctx.tenant.id } },
    select: {
      id: true,
      homeScore: true,
      awayScore: true,
      points: true,
      membershipId: true,
      membership: { select: { userId: true, displayName: true } },
    },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: entries.map((e) => e.membership.userId) } },
    select: { id: true, name: true, email: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  const rows = entries
    .map((e) => {
      const u = userById.get(e.membership.userId);
      return {
        id: e.id,
        membershipId: e.membershipId,
        name:
          e.membership.displayName ||
          (u ? publicDisplayName({ name: u.name, email: u.email }) : 'Jugador'),
        homeScore: e.homeScore,
        awayScore: e.awayScore,
        points: e.points,
        isMe: e.membershipId === ctx.membership.id,
      };
    })
    .sort((a, b) => (b.points ?? -1) - (a.points ?? -1));

  const total = rows.length;
  const homeWins = rows.filter((r) => r.homeScore > r.awayScore).length;
  const draws = rows.filter((r) => r.homeScore === r.awayScore).length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return Response.json({
    ...base,
    revealed: true,
    entries: rows,
    trend: { home: pct(homeWins), draw: pct(draws), away: pct(total - homeWins - draws) },
  });
}
