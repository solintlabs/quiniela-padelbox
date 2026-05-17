import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { PartidosClient } from '@/components/PartidosClient';
import type { InlineMatch } from '@/components/InlinePredictionRow';
import { STAGE_LABEL } from '@/lib/format';

export const metadata = { title: 'Partidos · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

const MUNDIAL_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const KNOCKOUT_STAGES = ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'] as const;

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

  const [mundialCount, ligaCount, me] = await Promise.all([
    prisma.match.count({ where: { group: { in: MUNDIAL_GROUPS } } }),
    prisma.match.count({ where: { group: 'LIGA' } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { championPick: true, championLockedAt: true },
    }),
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

  // Construir secciones segun la tab
  let sections: Array<{ title: string; items: InlineMatch[]; dim?: boolean }> = [];

  if (tab === 'mundial') {
    // Mundial: secciones por grupo A-L, luego rondas eliminatorias.
    for (const g of MUNDIAL_GROUPS) {
      const groupMatches = matches.filter((m) => m.group === g);
      if (groupMatches.length > 0) {
        sections.push({
          title: `Grupo ${g}`,
          items: groupMatches.map(toInline),
        });
      }
    }
    // Eliminatorias (cuando existan)
    for (const stage of KNOCKOUT_STAGES) {
      const stageMatches = matches.filter((m) => m.stage === stage);
      if (stageMatches.length > 0) {
        sections.push({
          title: STAGE_LABEL[stage] ?? stage,
          items: stageMatches.map(toInline),
        });
      }
    }
  } else {
    // La Liga: agrupacion clasica por estado.
    const upcoming = matches.filter((m) => m.status === 'SCHEDULED' && !m.lockedAt).map(toInline);
    const locked = matches
      .filter((m) => m.status !== 'FINISHED' && (m.status !== 'SCHEDULED' || m.lockedAt))
      .map(toInline);
    const finished = matches.filter((m) => m.status === 'FINISHED').map(toInline);
    sections = [
      { title: 'Próximos · puedes predecir', items: upcoming },
      { title: 'En juego o cerrados', items: locked, dim: true },
      { title: 'Finalizados', items: finished },
    ];
  }

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

      {/* Card MI CAMPEÓN (solo en tab Mundial) */}
      {tab === 'mundial' && (
        <section className="rounded-2xl border-2 border-accent/60 bg-accent/10 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-accent font-bold">
              MI CAMPEÓN
            </p>
            {me?.championPick ? (
              <>
                <p className="font-display text-2xl mt-1">{me.championPick.toUpperCase()}</p>
                <p className="text-xs text-muted mt-1">
                  {me.championLockedAt
                    ? '🔒 Pick congelado al inicio del torneo'
                    : 'Aún puedes cambiarlo antes del 11 jun'}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted mt-1">
                No has elegido todavía. Pick gana +25 pts si aciertas.
              </p>
            )}
          </div>
          {!me?.championLockedAt && (
            <Link
              href="/perfil"
              className="inline-flex items-center h-10 px-5 rounded-lg bg-accent text-accent-fg font-display text-sm hover:brightness-95 shrink-0"
            >
              {me?.championPick ? 'Cambiar →' : 'Elegir campeón →'}
            </Link>
          )}
        </section>
      )}

      <PartidosClient hasPaid={hasPaid} sections={sections} />

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
