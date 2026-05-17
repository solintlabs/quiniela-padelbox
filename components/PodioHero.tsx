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
 * Layout: 3 columnas. Cada columna tiene la INFO arriba (avatar + nombre + pts)
 * y el ESCALÓN debajo con altura distinta. Las bases de los escalones siempre
 * alineadas al fondo del contenedor (items-end en el padre).
 *
 * Para garantizar alineación: el contenedor padre tiene altura fija + cada
 * columna usa flex flex-col justify-end. La info "flota" arriba del escalón
 * gracias al contenedor info con altura uniforme.
 */
export function PodioHero({ top, me }: PodioHeroProps) {
  const [first, second, third] = top;

  return (
    <section>
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Ranking PADELBOX</p>
        <h1 className="font-display text-4xl mt-1">El Podio</h1>
      </header>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-2xl mx-auto mt-10">
        <PodioColumn row={second} pos={2} />
        <PodioColumn row={first} pos={1} crown />
        <PodioColumn row={third} pos={3} />
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
            <p className="text-xs text-muted text-right">
              A <span className="text-ink tabular-nums">{me.pointsToPodium} pts</span><br />del podio
            </p>
          ) : (
            <p className="text-xs text-success">¡Estás en el podio!</p>
          )}
        </div>
      )}
    </section>
  );
}

function PodioColumn({
  row,
  pos,
  crown,
}: {
  row?: RankingRow;
  pos: 1 | 2 | 3;
  crown?: boolean;
}) {
  // Alturas del escalón en píxeles (1º más alto, 2º medio, 3º más bajo)
  const stepHeight = pos === 1 ? 'h-32' : pos === 2 ? 'h-24' : 'h-16';
  const stepColors =
    pos === 1
      ? 'bg-accent/15 border-accent/60'
      : pos === 2
        ? 'bg-zinc-400/15 border-zinc-400/40'
        : 'bg-orange-400/10 border-orange-400/40';
  const stepNumberColor =
    pos === 1 ? 'text-accent' : pos === 2 ? 'text-zinc-300' : 'text-orange-300';
  const stepNumberSize = pos === 1 ? 'text-4xl' : 'text-3xl';

  return (
    <div className="flex flex-col items-center min-w-0">
      {/* Bloque info arriba (altura uniforme para que el podio esté alineado) */}
      <div className="flex-1 flex flex-col items-center justify-end gap-1 pb-3 min-w-0 w-full">
        {/* Corona ocupa espacio incluso si está vacía, para alinear avatares */}
        <div className="h-6 flex items-center">
          {crown && <span className="text-xl">🥇</span>}
        </div>
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-display shrink-0',
            pos === 1
              ? 'w-14 h-14 bg-accent text-accent-fg text-xl'
              : 'w-11 h-11 bg-bg-elev text-ink text-base border border-line',
          )}
        >
          {row ? initial(row) : '—'}
        </div>
        <p
          className={cn(
            'text-center text-xs truncate w-full',
            pos === 1 ? 'font-semibold text-sm' : 'text-muted',
          )}
        >
          {row?.name ?? row?.email ?? '—'}
        </p>
        <p className="text-[10px] text-muted tabular-nums">{row?.points ?? 0} pts</p>
      </div>

      {/* Escalón */}
      <div
        className={cn(
          'w-full rounded-t-lg border-t border-x flex items-center justify-center',
          stepHeight,
          stepColors,
        )}
      >
        <span className={cn('font-display tabular-nums', stepNumberSize, stepNumberColor)}>
          {pos}
        </span>
      </div>
    </div>
  );
}
