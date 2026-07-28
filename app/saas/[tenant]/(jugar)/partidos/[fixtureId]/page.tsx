import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { loadTenantPlayer } from '@/lib/saas/playerView';
import { lockTimeFor } from '@/lib/saas/scoring';
import { publicDisplayName } from '@/lib/display';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * Detalle de un partido: el marcador, tu pronóstico y —una vez CERRADO— lo que
 * pronosticaron los demás, con la tendencia (1X2). Antes del cierre no se
 * enseña nada de otros: sería copiar.
 */
export default async function FixtureDetailPage({
  params,
}: {
  params: { tenant: string; fixtureId: string };
}) {
  const { tenant, membershipId } = await loadTenantPlayer(params.tenant);

  const fixture = await prisma.saasFixture.findFirst({
    where: { id: params.fixtureId, competition: { tenantId: tenant.id } },
    include: {
      homeTeam: true,
      awayTeam: true,
      competition: { select: { id: true, name: true, lockOffsetMin: true } },
    },
  });
  if (!fixture) notFound();

  const now = new Date();
  const closed =
    fixture.lockedAt !== null ||
    lockTimeFor(fixture.kickoff, fixture.competition.lockOffsetMin).getTime() <= now.getTime();

  // Los pronósticos ajenos solo se revelan con el partido cerrado.
  const entries = closed
    ? await prisma.saasEntry.findMany({
        where: { fixtureId: fixture.id, membership: { tenantId: tenant.id } },
        select: {
          id: true,
          homeScore: true,
          awayScore: true,
          points: true,
          membershipId: true,
          membership: { select: { userId: true, displayName: true } },
        },
      })
    : await prisma.saasEntry.findMany({
        where: { fixtureId: fixture.id, membershipId },
        select: {
          id: true,
          homeScore: true,
          awayScore: true,
          points: true,
          membershipId: true,
          membership: { select: { userId: true, displayName: true } },
        },
      });

  // Nombre real del User cuando la membresía no tiene displayName propio.
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
        isMe: e.membershipId === membershipId,
        name:
          e.membership.displayName ||
          (u ? publicDisplayName({ name: u.name, email: u.email }) : 'Jugador'),
        home: e.homeScore,
        away: e.awayScore,
        points: e.points,
      };
    })
    .sort((a, b) => (b.points ?? -1) - (a.points ?? -1));

  // Tendencia 1X2 sobre los pronósticos revelados.
  const total = rows.length;
  const homeWins = rows.filter((r) => r.home > r.away).length;
  const draws = rows.filter((r) => r.home === r.away).length;
  const awayWins = total - homeWins - draws;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-5">
      <Link href={`/saas/${tenant.slug}/partidos`} className="text-sm text-muted hover:text-ink">
        ← Partidos
      </Link>

      <section className="rounded-xl border border-line bg-bg-elev p-5">
        <p className="text-xs text-muted">
          {formatDateTime(fixture.kickoff)}
          {fixture.round ? ` · ${fixture.round}` : ''}
        </p>
        <div className="flex items-center justify-between gap-4 mt-2">
          <span className="flex items-center gap-2 min-w-0">
            {fixture.homeTeam.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fixture.homeTeam.logoUrl} alt="" className="h-6 w-6 object-contain" />
            )}
            <span className="font-display text-lg truncate">{fixture.homeTeam.name}</span>
          </span>
          <span className="font-display text-2xl tabular-nums shrink-0">
            {fixture.homeScore ?? '–'}–{fixture.awayScore ?? '–'}
          </span>
          <span className="flex items-center gap-2 min-w-0 justify-end">
            <span className="font-display text-lg truncate">{fixture.awayTeam.name}</span>
            {fixture.awayTeam.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fixture.awayTeam.logoUrl} alt="" className="h-6 w-6 object-contain" />
            )}
          </span>
        </div>
      </section>

      {!closed ? (
        <p className="rounded-xl border border-line bg-bg-elev p-5 text-sm text-muted">
          Los pronósticos de los demás se muestran cuando cierre el partido.
        </p>
      ) : (
        <>
          <section className="rounded-xl border border-line bg-bg-elev p-5">
            <h2 className="font-display text-lg mb-3">Cómo predijeron</h2>
            <div className="flex h-3 rounded-full overflow-hidden border border-line">
              <span className="bg-accent" style={{ width: `${pct(homeWins)}%` }} />
              <span className="bg-zinc-500" style={{ width: `${pct(draws)}%` }} />
              <span className="bg-orange-400" style={{ width: `${pct(awayWins)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted mt-2 tabular-nums">
              <span>Gana {fixture.homeTeam.name}: {pct(homeWins)}%</span>
              <span>Empate: {pct(draws)}%</span>
              <span>Gana {fixture.awayTeam.name}: {pct(awayWins)}%</span>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg">Pronósticos ({total})</h2>
            {total === 0 ? (
              <p className="text-sm text-muted">Nadie pronosticó este partido.</p>
            ) : (
              <ol className="rounded-xl border border-line bg-bg-elev divide-y divide-line overflow-hidden">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className={'flex items-center gap-3 px-4 py-2.5 ' + (r.isMe ? 'bg-accent/5' : '')}
                  >
                    <span className="flex-1 min-w-0 truncate text-sm">
                      {r.name}
                      {r.isMe && <span className="text-muted"> · tú</span>}
                    </span>
                    <span className="tabular-nums text-sm">
                      {r.home}–{r.away}
                    </span>
                    <span className="font-display tabular-nums w-12 text-right">
                      {r.points === null ? '–' : `+${r.points}`}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
