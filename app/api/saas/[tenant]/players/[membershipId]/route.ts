import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { lockTimeFor } from '@/lib/saas/scoring';
import { publicDisplayName } from '@/lib/display';

/**
 * GET /api/saas/[tenant]/players/[membershipId]
 *
 * Perfil público de un jugador de la quiniela: estadísticas y sus pronósticos
 * de partidos YA CERRADOS (los abiertos se ocultan, salvo que seas tú).
 * Equivalente móvil de /saas/[tenant]/jugador/[membershipId].
 */
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { tenant: string; membershipId: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'PLAYER', req);
  if (ctx instanceof Response) return ctx;

  const target = await prisma.saasMembership.findFirst({
    where: { id: params.membershipId, tenantId: ctx.tenant.id },
    select: { id: true, userId: true, displayName: true, createdAt: true, hasPaid: true },
  });
  if (!target) return Response.json({ error: 'Jugador no encontrado.' }, { status: 404 });

  const [user, competition] = await Promise.all([
    prisma.user.findUnique({ where: { id: target.userId }, select: { name: true, email: true } }),
    prisma.saasCompetition.findFirst({
      where: { tenantId: ctx.tenant.id, status: { in: ['OPEN', 'LOCKED', 'FINISHED'] } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, lockOffsetMin: true, pointsExact: true, pointsDrawBonus: true },
    }),
  ]);

  const isMe = target.id === ctx.membership.id;
  const entries = competition
    ? await prisma.saasEntry.findMany({
        where: { membershipId: target.id, fixture: { competitionId: competition.id } },
        include: {
          fixture: {
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
        orderBy: { fixture: { kickoff: 'desc' } },
      })
    : [];

  const now = Date.now();
  const visible = entries.filter(
    (e) =>
      isMe ||
      e.fixture.lockedAt !== null ||
      lockTimeFor(e.fixture.kickoff, competition?.lockOffsetMin ?? 0).getTime() <= now,
  );

  const scored = entries.filter((e) => e.points !== null);
  const points = scored.reduce((acc, e) => acc + (e.points ?? 0), 0);
  const exact = competition
    ? scored.filter(
        (e) =>
          e.points === competition.pointsExact ||
          e.points === competition.pointsExact + competition.pointsDrawBonus,
      ).length
    : 0;

  return Response.json({
    player: {
      membershipId: target.id,
      name:
        target.displayName ||
        (user ? publicDisplayName({ name: user.name, email: user.email }) : 'Jugador'),
      joinedAt: target.createdAt.toISOString(),
      hasPaid: target.hasPaid,
      isMe,
    },
    stats: { points, total: entries.length, exact },
    hiddenCount: entries.length - visible.length,
    predictions: visible.map((e) => ({
      id: e.id,
      home: e.fixture.homeTeam.name,
      away: e.fixture.awayTeam.name,
      homeScore: e.homeScore,
      awayScore: e.awayScore,
      points: e.points,
    })),
  });
}
