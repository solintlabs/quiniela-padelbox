import type { RankingRow } from './RankingTable';
import { cn } from '@/lib/utils';

interface PodioHeroProps {
  top: RankingRow[];
  me?: { position: number; row: RankingRow; pointsToPodium: number } | null;
}

function initial(row: RankingRow) {
  return (row.name?.[0] ?? row.email[0] ?? '?').toUpperCase();
}

/**
 * Dashboard variante C — podio social.
 * Top-3 visual + tu posición + diferencia al podio.
 */
export function PodioHero({ top, me }: PodioHeroProps) {
  const [first, second, third] = top;

  return (
    <section>
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Ranking PADELBOX</p>
        <h1 className="font-display text-4xl mt-1">El Podio</h1>
      </header>

      <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto mt-10 items-end">
        <PodioStep row={second} pos={2} accentClass="bg-zinc-300/20 border-zinc-300/40 text-zinc-300" height="h-24" />
        <PodioStep row={first}  pos={1} accentClass="bg-accent/20 border-accent/50 text-accent" height="h-32" crown />
        <PodioStep row={third}  pos={3} accentClass="bg-orange-300/10 border-orange-300/40 text-orange-200" height="h-16" />
      </div>

      {me && (
        <div className="mt-8 rounded-xl border border-line bg-bg-elev p-4 flex items-center justify-between max-w-xl mx-auto">
          <div>
            <p className="text-xs text-muted">Tu posición</p>
            <p className="font-display text-2xl tabular-nums">
              #{me.position} · <span className="text-accent">{me.row.points}</span> pts
            </p>
          </div>
          {me.pointsToPodium > 0 ? (
            <p className="text-xs text-muted">
              A <span className="text-ink tabular-nums">{me.pointsToPodium} pts</span> del podio
            </p>
          ) : (
            <p className="text-xs text-success">¡Estás en el podio!</p>
          )}
        </div>
      )}
    </section>
  );
}

function PodioStep({
  row,
  pos,
  accentClass,
  height,
  crown,
}: {
  row?: RankingRow;
  pos: number;
  accentClass: string;
  height: string;
  crown?: boolean;
}) {
  if (!row) {
    return (
      <div className="text-center opacity-40">
        <div className="w-14 h-14 rounded-full bg-bg-elev mx-auto" />
        <p className="text-xs text-muted mt-2">—</p>
        <div className={cn('mt-2 rounded-t-lg border-t border-x', accentClass, height)} />
      </div>
    );
  }
  return (
    <div className="text-center">
      {crown && <div className="text-2xl">🥇</div>}
      <div className={cn(
        'rounded-full font-display flex items-center justify-center mx-auto mb-2',
        pos === 1 ? 'w-16 h-16 bg-accent text-accent-fg text-2xl' : 'w-14 h-14 bg-bg-elev text-ink text-xl border border-line',
      )}>
        {initial(row)}
      </div>
      <p className={pos === 1 ? 'font-semibold' : 'text-sm font-semibold'}>{row.name ?? row.email}</p>
      <p className="text-xs text-muted tabular-nums">{row.points} pts</p>
      <div className={cn('mt-2 rounded-t-lg border-t border-x flex items-end justify-center pb-2 font-display', accentClass, height)}>
        <span className={pos === 1 ? 'text-4xl' : pos === 2 ? 'text-3xl' : 'text-2xl'}>{pos}</span>
      </div>
    </div>
  );
}
