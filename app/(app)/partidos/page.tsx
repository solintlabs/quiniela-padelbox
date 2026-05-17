import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { PartidosClient } from '@/components/PartidosClient';
import type { InlineMatch } from '@/components/InlinePredictionRow';

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
  const hasPaid = session!.user.hasPaid;
  const tab: Tab = searchParams.tab === 'liga' ? 'liga' : 'mundial';

  const [mundialCount, ligaCount] = await Promise.all([
    prisma.match.count({ where: { group: { in: MUNDIAL_GROUPS } } }),
    prisma.match.count({ where: { group: 'LIGA' } }),
  ]);

  const matches = await prisma.match.findMany({
    where: tab === 'liga' ? { group: 'LIGA' } : { group: { in: MUNDIAL_GROUPS } },
    orderBy: { kickoff: 'asc' },
    include: {
      predictions: {
        where: { userId },
        select: { homeScore: true, awayScore: true, points: true },
      },
    },
  });

  function toInline(m: typeof matches[number]): InlineMatch {
    return {
      id: m.id,
      stage: m.stage,
      group: m.group,
      kickoff: m.kickoff.toISOString(),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeFlag: m.homeFlag,
      awayFlag: m.awayFlag,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
      lockedAt: m.lockedAt ? m.lockedAt.toISOString() : null,
      initial: m.predictions[0]
        ? {
            homeScore: m.predictions[0].homeScore,
            awayScore: m.predictions[0].awayScore,
            points: m.predictions[0].points,
          }
        : null,
    };
  }

  const upcoming = matches.filter((m) => m.status === 'SCHEDULED' && !m.lockedAt).map(toInline);
  const locked = matches
    .filter((m) => m.status !== 'FINISHED' && (m.status !== 'SCHEDULED' || m.lockedAt))
    .map(toInline);
  const finished = matches.filter((m) => m.status === 'FINISHED').map(toInline);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl">Partidos</h1>
        <p className="text-sm text-muted mt-1">
          {tab === 'mundial'
            ? `Mundial 2026 · ${matches.length} partidos`
            : `La Liga · ${matches.length} partidos`}
        </p>
        {!hasPaid && (
          <p className="text-xs text-warning mt-2">
            ⚠ Tu cuenta no está activa. Puedes ver partidos pero no enviar pronósticos hasta que el admin confirme tu pago.{' '}
            <Link href="/inscripcion" className="underline">Ver cómo inscribirte →</Link>
          </p>
        )}
        <p className="text-xs text-muted mt-2">
          💡 Modifica los marcadores y pulsa <strong>Guardar</strong> en cada fila o{' '}
          <strong>Guardar todo</strong> arriba para enviar varios a la vez.
        </p>
      </header>

      <nav className="flex gap-2 border-b border-line">
        <TabLink href="/partidos?tab=mundial" active={tab === 'mundial'} label="🌍 Mundial 2026" count={mundialCount} />
        <TabLink href="/partidos?tab=liga" active={tab === 'liga'} label="🇪🇸 La Liga" count={ligaCount} />
      </nav>

      <PartidosClient
        hasPaid={hasPaid}
        sections={[
          { title: 'Próximos · puedes predecir', items: upcoming },
          { title: 'En juego o cerrados (esperando resultado)', items: locked, dim: true },
          { title: 'Finalizados', items: finished },
        ]}
      />

      {matches.length === 0 && (
        <p className="text-sm text-muted text-center py-10">
          No hay partidos cargados en esta competición.
        </p>
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
