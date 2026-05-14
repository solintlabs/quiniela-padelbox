import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { MatchCard } from '@/components/MatchCard';
import { STAGE_LABEL } from '@/lib/format';

export const metadata = { title: 'Partidos · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function PartidosPage() {
  const session = await auth();
  const userId = session!.user.id;

  const matches = await prisma.match.findMany({
    orderBy: { kickoff: 'asc' },
    include: {
      predictions: {
        where: { userId },
        select: { homeScore: true, awayScore: true, points: true },
      },
    },
  });

  const upcoming = matches.filter((m) => m.status === 'SCHEDULED' && !m.lockedAt);
  const locked = matches.filter((m) => m.status !== 'FINISHED' && (m.status !== 'SCHEDULED' || m.lockedAt));
  const finished = matches.filter((m) => m.status === 'FINISHED');

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl">Partidos</h1>
        <p className="text-sm text-muted mt-1">Mundial 2026 · {matches.length} partidos en total</p>
      </header>

      <Section title="Próximos · puedes predecir" items={upcoming} userId={userId} />
      <Section title="En juego o cerrados" items={locked} userId={userId} dim />
      <Section title="Finalizados" items={finished} userId={userId} />
    </div>
  );
}

function Section({
  title,
  items,
  userId,
  dim,
}: {
  title: string;
  items: Awaited<ReturnType<typeof prisma.match.findMany>>;
  userId: string;
  dim?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.18em] text-muted mb-3">{title}</h2>
      <div className={'space-y-3 ' + (dim ? 'opacity-80' : '')}>
        {items.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            myPrediction={(m as any).predictions?.[0] ?? null}
          />
        ))}
      </div>
    </section>
  );
}
