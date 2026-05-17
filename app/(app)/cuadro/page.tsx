import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { computeGroupStandings, type TeamStanding } from '@/lib/groupStandings';
import { PdfExportButton } from './PdfExportButton';

export const metadata = { title: 'Mi Cuadro · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

const POS_COLOR: Record<number, string> = {
  1: 'text-accent',
  2: 'text-blue-400',
  3: 'text-amber-400',
  4: 'text-zinc-500',
};

const POS_BORDER: Record<number, string> = {
  1: 'border-accent/60',
  2: 'border-blue-400/40',
  3: 'border-amber-400/40',
  4: 'border-zinc-700',
};

export default async function CuadroPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [matches, me] = await Promise.all([
    prisma.match.findMany({
      where: { stage: 'GROUP' },
      include: { predictions: { where: { userId } } },
      orderBy: { kickoff: 'asc' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, championPick: true, championLockedAt: true },
    }),
  ]);

  const groups = computeGroupStandings(matches);
  const totalPredicted = groups.reduce((s, g) => s + g.matchesPredicted, 0);
  const totalMatches = groups.reduce((s, g) => s + g.matchesTotal, 0);
  const completePct = totalMatches > 0 ? Math.round((totalPredicted / totalMatches) * 100) : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold">MUNDIAL 2026</p>
        <h1 className="font-display text-4xl mt-2">Mi Cuadro</h1>
        <p className="text-sm text-muted mt-2 max-w-xl mx-auto">
          Así quedan los grupos según tus predicciones. El bracket cascada se desbloquea al cerrar la fase de grupos.
        </p>

        <div className="mt-6 flex items-center gap-4 max-w-md mx-auto">
          <div className="flex-1 h-2 rounded-full bg-bg-elev overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${completePct}%` }} />
          </div>
          <span className="text-sm font-semibold text-muted tabular-nums whitespace-nowrap">
            {totalPredicted}/{totalMatches}
          </span>
        </div>
        <div className="mt-4 flex gap-3 justify-center flex-wrap no-print">
          {completePct < 100 && (
            <Link
              href="/predecir-grupos"
              className="inline-flex items-center h-10 px-5 rounded-lg bg-accent text-accent-fg font-display text-sm hover:brightness-95"
            >
              {completePct === 0 ? 'EMPEZAR PREDICCIONES →' : 'COMPLETAR PREDICCIONES →'}
            </Link>
          )}
          <PdfExportButton />
        </div>
      </header>

      {/* MI CAMPEÓN */}
      <section className="rounded-2xl border-2 border-accent/60 bg-accent/10 p-6 text-center max-w-md mx-auto">
        <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold">MI CAMPEÓN</p>
        {me?.championPick ? (
          <>
            <p className="font-display text-3xl mt-2">{me.championPick.toUpperCase()}</p>
            <p className="text-xs text-muted mt-2">
              {me.championLockedAt
                ? '🔒 Pick congelado al inicio del torneo'
                : 'Aún puedes cambiarlo antes del 11 jun'}
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl text-muted mt-2">Sin elegir</p>
            <Link href="/perfil" className="text-sm text-accent underline mt-3 inline-block">
              Elegir campeón →
            </Link>
          </>
        )}
      </section>

      {/* Grupos */}
      {groups.length === 0 ? null : (
        <section>
          <h2 className="font-display text-xs uppercase tracking-[0.28em] text-muted text-center mb-4">
            FASE DE GRUPOS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => (
              <GroupCard key={g.group} group={g.group} standings={g.standings} predicted={g.matchesPredicted} total={g.matchesTotal} />
            ))}
          </div>
        </section>
      )}

      {/* Leyenda */}
      <section className="rounded-xl border border-line bg-bg-elev p-5 max-w-md mx-auto">
        <p className="text-xs uppercase tracking-[0.18em] text-muted mb-3">LEYENDA</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <LegendItem dot="bg-accent" label="1º · clasifica" />
          <LegendItem dot="bg-blue-400" label="2º · clasifica" />
          <LegendItem dot="bg-amber-400" label="3º · posible" />
          <LegendItem dot="bg-zinc-500" label="4º · fuera" />
        </div>
        <p className="text-[11px] text-muted mt-3 italic">
          Los 8 mejores 3ros también pasan a R32. El bracket cascada R32→Final se construye automático al cerrar grupos.
        </p>
      </section>
    </div>
  );
}

function GroupCard({ group, standings, predicted, total }: { group: string; standings: TeamStanding[]; predicted: number; total: number }) {
  return (
    <article className="rounded-xl border border-line bg-bg-elev p-3">
      <header className="flex items-center justify-between mb-2 px-1">
        <span className="font-display text-sm tracking-wider">GRUPO {group}</span>
        <span className="text-[10px] text-muted tabular-nums">{predicted}/{total}</span>
      </header>
      <ul className="divide-y divide-line">
        {standings.map((s, i) => (
          <TeamRow key={s.team} position={i + 1} standing={s} />
        ))}
      </ul>
    </article>
  );
}

function TeamRow({ position, standing }: { position: number; standing: TeamStanding }) {
  return (
    <li className={`flex items-center gap-2 py-1.5 px-1 border-l-2 ${POS_BORDER[position]}`}>
      <span className={`font-display text-sm w-5 text-center ${POS_COLOR[position]}`}>{position}</span>
      {standing.flag ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={standing.flag} alt="" className="w-5 h-5 rounded-sm object-cover" />
      ) : (
        <div className="w-5 h-5 rounded-sm bg-line" />
      )}
      <span className="flex-1 text-sm font-semibold truncate">{standing.team}</span>
      <span className={`font-display text-sm tabular-nums ${POS_COLOR[position]}`}>{standing.pts}</span>
    </li>
  );
}

function LegendItem({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
