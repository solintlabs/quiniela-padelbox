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
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted">Ranking PADELBOX</p>
        <h1 className="font-display text-xl sm:text-3xl mt-0.5">El Podio</h1>
      </header>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xl mx-auto mt-3 sm:mt-6">
        <PodioColumn row={second} pos={2} />
        <PodioColumn row={first} pos={1} crown />
        <PodioColumn row={third} pos={3} />
      </div>

      {me && (
        <div className="mt-3 sm:mt-5 rounded-xl border border-line bg-bg-elev p-2.5 sm:p-3 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-[11px] sm:text-xs text-muted">Tu posición</p>
            <p className="font-display text-lg sm:text-2xl tabular-nums">
              #{me.position} · <span className="text-accent">{me.row.points}</span> pts
            </p>
          </div>
          {me.pointsToPodium > 0 ? (
            <p className="text-[11px] sm:text-xs text-muted text-right">
              A <span className="text-ink tabular-nums">{me.pointsToPodium} pts</span><br />del podio
            </p>
          ) : (
            <p className="text-[11px] sm:text-xs text-success">¡Estás en el podio!</p>
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
  // Alturas del escalón (más compacto que antes)
  const stepHeight =
    pos === 1
      ? 'h-14 sm:h-20'
      : pos === 2
        ? 'h-10 sm:h-14'
        : 'h-8 sm:h-10';
  // Colores con mas opacidad para que se vean tanto en dark como en light
  const stepColors =
    pos === 1
      ? 'bg-accent/25 border-accent/70 dark:bg-accent/15 dark:border-accent/60'
      : pos === 2
        ? 'bg-zinc-400/25 border-zinc-400/60 dark:bg-zinc-400/15 dark:border-zinc-400/40'
        : 'bg-orange-400/25 border-orange-400/70 dark:bg-orange-400/10 dark:border-orange-400/40';
  const stepNumberColor =
    pos === 1
      ? 'text-accent'
      : pos === 2
        ? 'text-zinc-500 dark:text-zinc-300'
        : 'text-orange-500 dark:text-orange-300';
  const stepNumberSize = pos === 1 ? 'text-xl sm:text-3xl' : 'text-lg sm:text-2xl';

  return (
    <div className="flex flex-col items-center min-w-0">
      {/* Bloque info arriba (altura uniforme para que el podio esté alineado) */}
      <div className="flex-1 flex flex-col items-center justify-end gap-0.5 sm:gap-1 pb-2 sm:pb-3 min-w-0 w-full">
        {/* Corona ocupa espacio incluso si está vacía, para alinear avatares */}
        <div className="h-5 sm:h-6 flex items-center">
          {crown && <span className="text-base sm:text-xl">🥇</span>}
        </div>
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-display shrink-0',
            pos === 1
              ? 'w-10 h-10 sm:w-14 sm:h-14 bg-accent text-accent-fg text-base sm:text-xl'
              : 'w-8 h-8 sm:w-11 sm:h-11 bg-bg-elev text-ink text-sm sm:text-base border border-line',
          )}
        >
          {row ? initial(row) : '—'}
        </div>
        <p
          className={cn(
            'text-center text-[11px] sm:text-xs truncate w-full',
            pos === 1 ? 'font-semibold sm:text-sm' : 'text-muted',
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
