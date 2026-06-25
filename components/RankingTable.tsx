import Link from 'next/link';

export interface RankingRow {
  userId: string;
  name: string | null;
  email: string;
  played: number;
  exact: number;
  points: number;
  // Movimiento de posicion desde el ultimo snapshot diario:
  // > 0 subio, < 0 bajo, 0 igual, null sin snapshot previo (nuevo).
  movement?: number | null;
  // Campeon elegido (solo si congelado) + su bandera, para verlo en el ranking.
  champion?: string | null;
  championFlag?: string | null;
}

interface RankingTableProps {
  rows: RankingRow[];
  meId?: string;
}

const MEDAL = ['🥇', '🥈', '🥉'];

/** Flecha de movimiento de posicion (verde sube / roja baja / gris igual). */
function Movement({ m }: { m?: number | null }) {
  if (m === null || m === undefined) return null;
  if (m > 0)
    return (
      <span className="text-success text-[10px] font-semibold leading-none" title={`Subió ${m}`}>
        ▲{m}
      </span>
    );
  if (m < 0)
    return (
      <span className="text-danger text-[10px] font-semibold leading-none" title={`Bajó ${-m}`}>
        ▼{-m}
      </span>
    );
  return (
    <span className="text-muted/50 text-[10px] leading-none" title="Sin cambios">
      –
    </span>
  );
}

export function RankingTable({ rows, meId }: RankingTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted text-center py-10">
        Aún no hay puntos. ¡Empieza la quiniela!
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
      <div className="flex items-center gap-1 px-3 sm:px-4 py-3 text-[10px] sm:text-xs uppercase tracking-[0.12em] text-muted border-b border-line">
        <span className="w-12 sm:w-14 shrink-0">#</span>
        <span className="flex-1 min-w-0">Jugador</span>
        <span className="w-8 sm:w-12 text-right shrink-0">PJ</span>
        <span className="w-10 sm:w-20 text-right shrink-0">Exac.</span>
        <span className="w-10 sm:w-16 text-right shrink-0">Pts</span>
        <span className="w-4 shrink-0" />
      </div>
      {rows.map((row, i) => {
        const pos = i + 1;
        const isMe = row.userId === meId;
        return (
          <Link
            key={row.userId}
            href={`/usuarios/${row.userId}`}
            className={
              'flex items-center gap-1 px-3 sm:px-4 py-3 text-sm border-t border-line hover:bg-bg transition-colors ' +
              (isMe ? 'bg-accent/10' : '')
            }
          >
            <span className="w-12 sm:w-14 shrink-0 tabular-nums flex items-center gap-0.5">
              {pos <= 3 ? `${MEDAL[pos - 1]} ${pos}` : isMe ? `▶ ${pos}` : pos}
              <Movement m={row.movement} />
            </span>
            <span className={'flex-1 min-w-0 flex items-center gap-1.5 ' + (isMe ? 'font-semibold' : '')}>
              {row.championFlag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.championFlag}
                  alt=""
                  title={row.champion ? `Campeón: ${row.champion}` : undefined}
                  className="w-4 h-4 rounded-sm shrink-0 object-cover"
                />
              )}
              <span className="truncate min-w-0 flex-1">{row.name ?? row.email}</span>
              {isMe && <span className="text-muted text-xs shrink-0">· tú</span>}
            </span>
            <span className="w-8 sm:w-12 text-right shrink-0 tabular-nums">{row.played}</span>
            <span className="w-10 sm:w-20 text-right shrink-0 tabular-nums">{row.exact}</span>
            <span className={'w-10 sm:w-16 text-right shrink-0 tabular-nums font-display ' + (isMe ? 'text-accent' : '')}>
              {row.points}
            </span>
            <span className="w-4 shrink-0 text-right text-muted">→</span>
          </Link>
        );
      })}
    </div>
  );
}
