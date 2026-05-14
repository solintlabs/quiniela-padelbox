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

  const [ranking, nextMatch] = await Promise.all([
    computeRanking(),
    prisma.match.findFirst({
      where: { status: 'SCHEDULED', lockedAt: null },
      orderBy: { kickoff: 'asc' },
    }),
  ]);

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

      {nextMatch ? (
        <section className="rounded-xl border border-accent/30 bg-accent/5 p-6 shadow-glow-accent max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs text-muted mb-3">
            <span className="uppercase tracking-[0.18em]">Siguiente partido</span>
            <span className="text-accent">
              Cierra en <Countdown target={nextMatch.kickoff} />
            </span>
          </div>
          <p className="text-center font-display text-2xl">
            {nextMatch.homeTeam} <span className="text-muted">vs</span> {nextMatch.awayTeam}
          </p>
          <p className="text-center text-xs text-muted mt-1">
            {formatDateTime(nextMatch.kickoff)}
          </p>
          <div className="mt-5 text-center">
            <Link
              href={`/partidos/${nextMatch.id}`}
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-accent text-accent-fg font-display tracking-tight hover:brightness-95"
            >
              PREDECIR →
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
