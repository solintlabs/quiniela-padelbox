import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';

export const metadata = { title: 'Cuadro de eliminatorias · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

const KNOCKOUT_STAGES = ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'] as const;

/** Equipo "por definir" del bracket (placeholder de ESPN antes del cruce real). */
const isPlaceholder = (s: string) =>
  /group\s|round of|third place|\bwinner\b|\brunner\b|\bwin\b|\bplace\b|\b\d(st|nd|rd|th)\b/i.test(s);

/**
 * Vista de SOLO LECTURA del cuadro de eliminatorias. Muestra todas las rondas
 * (1/16 → Final) con sus cruces llenándose: equipos "por definir" mientras no
 * se sepan, equipos reales + resultado conforme avanza el torneo, y tu propio
 * pronóstico en cada partido cerrado. Para "ir viendo cómo va quedando".
 */
export default async function BracketPage() {
  const session = await auth();
  const userId = session!.user.id;

  const matches = await prisma.match.findMany({
    where: { excludeFromScoring: false, stage: { in: [...KNOCKOUT_STAGES] } },
    orderBy: { kickoff: 'asc' },
    include: {
      predictions: { where: { userId }, select: { homeScore: true, awayScore: true, points: true } },
    },
  });

  const rounds = KNOCKOUT_STAGES.map((stage) => ({
    stage,
    label: STAGE_LABEL[stage] ?? stage,
    items: matches.filter((m) => m.stage === stage),
  })).filter((r) => r.items.length > 0);

  const totalDefinidos = matches.filter(
    (m) => !isPlaceholder(m.homeTeam) && !isPlaceholder(m.awayTeam),
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl">Cuadro de eliminatorias</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          {matches.length === 0
            ? 'Aún no hay partidos de eliminatorias cargados.'
            : `${totalDefinidos}/${matches.length} cruces definidos · se van rellenando conforme avanza el Mundial.`}
        </p>
        <p className="text-xs text-muted mt-2">
          💡 Cada cruce se abre para pronosticar en la pestaña{' '}
          <strong>Partidos</strong> en cuanto se conocen sus dos equipos.
        </p>
      </header>

      {rounds.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          Las eliminatorias aparecerán aquí cuando termine la fase de grupos.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rounds.map((r) => (
            <section key={r.stage} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {r.label}
                <span className="ml-2 text-muted font-normal tracking-normal normal-case">
                  ({r.items.length})
                </span>
              </h2>
              <div className="space-y-2">
                {r.items.map((m) => (
                  <BracketMatch key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

type BracketMatchData = {
  id: string;
  kickoff: Date;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string | null;
  awayFlag: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  predictions: Array<{ homeScore: number; awayScore: number; points: number | null }>;
};

function teamName(s: string): string {
  return isPlaceholder(s) ? 'Por definir' : s;
}

function BracketMatch({ match: m }: { match: BracketMatchData }) {
  const homeReal = !isPlaceholder(m.homeTeam);
  const awayReal = !isPlaceholder(m.awayTeam);
  const defined = homeReal && awayReal;
  const finished = m.status === 'FINISHED' && m.homeScore !== null && m.awayScore !== null;
  const live = m.status === 'LIVE';
  const pred = m.predictions[0];

  return (
    <article
      className={
        'rounded-lg border p-3 text-sm ' +
        (finished
          ? 'border-line bg-bg-elev'
          : defined
            ? 'border-accent/40 bg-accent/5'
            : 'border-line bg-bg-elev/50')
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className={'flex items-center gap-1.5 min-w-0 ' + (homeReal ? '' : 'text-muted italic')}>
          {homeReal && m.homeFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.homeFlag} alt="" className="w-5 h-5 rounded-sm shrink-0 object-cover" />
          )}
          <span className="truncate">{teamName(m.homeTeam)}</span>
        </span>
        <span className="font-display tabular-nums shrink-0 px-2">
          {finished || live ? `${m.homeScore ?? 0}–${m.awayScore ?? 0}` : 'vs'}
        </span>
        <span className={'flex items-center gap-1.5 min-w-0 justify-end ' + (awayReal ? '' : 'text-muted italic')}>
          <span className="truncate text-right">{teamName(m.awayTeam)}</span>
          {awayReal && m.awayFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.awayFlag} alt="" className="w-5 h-5 rounded-sm shrink-0 object-cover" />
          )}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-muted">
        <span>
          {live ? <span className="text-success font-semibold">● EN VIVO</span> : formatDateTime(m.kickoff)}
        </span>
        {pred ? (
          <span className="tabular-nums">
            Tu pron.: <span className="text-ink">{pred.homeScore}–{pred.awayScore}</span>
            {pred.points !== null && (
              <span className={pred.points > 0 ? ' text-success' : ' text-muted'}> (+{pred.points})</span>
            )}
          </span>
        ) : finished ? (
          <span className="text-muted">No pronosticaste</span>
        ) : null}
      </div>
    </article>
  );
}
