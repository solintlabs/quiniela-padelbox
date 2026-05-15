import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { computeRanking } from '@/lib/ranking';
import { PodioHero } from '@/components/PodioHero';
import { Countdown } from '@/components/Countdown';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Inicio · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [ranking, nextMatch, groupStats] = await Promise.all([
    computeRanking(),
    prisma.match.findFirst({
      where: { status: 'SCHEDULED', lockedAt: null },
      orderBy: { kickoff: 'asc' },
      include: {
        predictions: {
          where: { userId },
          select: { homeScore: true, awayScore: true },
        },
      },
    }),
    (async () => {
      const offsetMs = 15 * 60_000;
      const now = new Date(Date.now() + offsetMs);
      const total = await prisma.match.count({
        where: { stage: 'GROUP', kickoff: { gt: now }, group: { in: ['A','B','C','D','E','F','G','H','I','J','K','L'] } },
      });
      const filled = await prisma.prediction.count({
        where: { userId, match: { stage: 'GROUP', kickoff: { gt: now }, group: { in: ['A','B','C','D','E','F','G','H','I','J','K','L'] } } },
      });
      return { total, filled };
    })(),
  ]);

  const myPrediction = nextMatch?.predictions?.[0];

  const top3 = ranking.slice(0, 3);
  const position = ranking.findIndex((r) => r.userId === userId);
  const me =
    position >= 0
      ? {
          position: position + 1,
          row: ranking[position],
          pointsToPodium: Math.max(0, (ranking[2]?.points ?? 0) - ranking[position].points + 1),
        }
      : null;

  return (
    <div className="space-y-12">
      <PodioHero top={top3} me={me} />

      {groupStats.total > 0 && groupStats.filled < groupStats.total && (
        <section className="rounded-xl border border-accent/30 bg-accent/5 p-5 max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <p className="font-display text-lg leading-tight">Rellena tu quiniela</p>
              <p className="text-sm text-muted mt-1">
                Llevas <span className="text-accent font-semibold tabular-nums">{groupStats.filled}</span>{' '}
                de <span className="tabular-nums">{groupStats.total}</span> partidos de fase de grupos.
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-bg overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${(groupStats.filled / Math.max(groupStats.total, 1)) * 100}%` }}
                />
              </div>
              <Link
                href="/predecir-grupos"
                className="inline-flex items-center mt-4 h-10 px-5 rounded-lg bg-accent text-accent-fg font-display text-sm hover:brightness-95"
              >
                {groupStats.filled === 0 ? 'EMPEZAR →' : 'CONTINUAR →'}
              </Link>
            </div>
          </div>
        </section>
      )}

      {nextMatch ? (
        <section className="rounded-xl border border-accent/30 bg-accent/5 p-6 shadow-glow-accent max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs text-muted mb-5">
            <span className="uppercase tracking-[0.18em]">Siguiente partido</span>
            <span className="text-accent">
              Cierra en <Countdown target={nextMatch.kickoff} />
            </span>
          </div>
          <div className="flex items-center justify-around gap-3">
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              {nextMatch.homeFlag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nextMatch.homeFlag}
                  alt=""
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <p className="font-display text-lg leading-tight text-center truncate w-full">
                {nextMatch.homeTeam}
              </p>
            </div>
            <span className="font-display text-xl text-muted">vs</span>
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              {nextMatch.awayFlag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nextMatch.awayFlag}
                  alt=""
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <p className="font-display text-lg leading-tight text-center truncate w-full">
                {nextMatch.awayTeam}
              </p>
            </div>
          </div>
          <p className="text-center text-xs text-muted mt-4">
            {formatDateTime(nextMatch.kickoff)}
          </p>
          {myPrediction && (
            <p className="text-center text-sm mt-3">
              <span className="text-muted">Tu pronóstico:</span>{' '}
              <span className="font-display tabular-nums text-lg text-accent">
                {myPrediction.homeScore}–{myPrediction.awayScore}
              </span>
            </p>
          )}
          <div className="mt-5 text-center">
            <Link
              href={`/partidos/${nextMatch.id}`}
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-accent text-accent-fg font-display tracking-tight hover:brightness-95"
            >
              {myPrediction ? 'EDITAR PRONÓSTICO →' : 'PREDECIR →'}
            </Link>
          </div>
        </section>
      ) : (
        <section className="text-center text-muted text-sm">
          No hay partidos pendientes. Ve a <Link href="/partidos" className="underline">/partidos</Link>.
        </section>
      )}
    </div>
  );
}
