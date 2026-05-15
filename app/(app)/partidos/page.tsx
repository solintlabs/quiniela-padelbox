import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { MatchCard } from '@/components/MatchCard';

export const metadata = { title: 'Partidos · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

const MUNDIAL_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

type Tab = 'mundial' | 'liga';

export default async function PartidosPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;
  const tab: Tab = searchParams.tab === 'liga' ? 'liga' : 'mundial';

  // Recuento por competición para los badges de los tabs
  const [mundialCount, ligaCount] = await Promise.all([
    prisma.match.count({ where: { group: { in: MUNDIAL_GROUPS } } }),
    prisma.match.count({ where: { group: 'LIGA' } }),
  ]);

  const matches = await prisma.match.findMany({
    where:
      tab === 'liga'
        ? { group: 'LIGA' }
        : { group: { in: MUNDIAL_GROUPS } },
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
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl">Partidos</h1>
        <p className="text-sm text-muted mt-1">
          {tab === 'mundial'
            ? `Mundial 2026 · ${matches.length} partidos`
            : `La Liga · ${matches.length} partidos`}
        </p>
      </header>

      {/* Tabs competición */}
      <nav className="flex gap-2 border-b border-line">
        <TabLink href="/partidos?tab=mundial" active={tab === 'mundial'} label="🌍 Mundial 2026" count={mundialCount} />
        <TabLink href="/partidos?tab=liga" active={tab === 'liga'} label="🇪🇸 La Liga" count={ligaCount} />
      </nav>

      <Section title="Próximos · puedes predecir" items={upcoming} />
      <Section title="En juego o cerrados" items={locked} dim />
      <Section title="Finalizados" items={finished} />

      {matches.length === 0 && (
        <p className="text-sm text-muted text-center py-10">No hay partidos cargados en esta competición.</p>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={
        'px-4 py-2 text-sm border-b-2 -mb-px transition-colors ' +
        (active
          ? 'border-accent text-ink font-semibold'
          : 'border-transparent text-muted hover:text-ink')
      }
    >
      {label} <span className="text-xs text-muted">({count})</span>
    </Link>
  );
}

function Section({
  title,
  items,
  dim,
}: {
  title: string;
  items: Awaited<ReturnType<typeof prisma.match.findMany>>;
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
