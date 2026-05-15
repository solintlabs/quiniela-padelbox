import Link from 'next/link';

export interface RankingRow {
  userId: string;
  name: string | null;
  email: string;
  played: number;
  exact: number;
  points: number;
}

interface RankingTableProps {
  rows: RankingRow[];
  meId?: string;
}

const MEDAL = ['🥇', '🥈', '🥉'];

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
      <div className="flex items-center px-4 py-3 text-xs uppercase tracking-[0.12em] text-muted border-b border-line">
        <span className="w-14">#</span>
        <span className="flex-1">Jugador</span>
        <span className="w-12 text-right">PJ</span>
        <span className="w-20 text-right">Exactos</span>
        <span className="w-16 text-right">Pts</span>
        <span className="w-6" />
      </div>
      {rows.map((row, i) => {
        const pos = i + 1;
        const isMe = row.userId === meId;
        return (
          <Link
            key={row.userId}
            href={`/usuarios/${row.userId}`}
            className={
              'flex items-center px-4 py-3 text-sm border-t border-line hover:bg-bg transition-colors ' +
              (isMe ? 'bg-accent/10' : '')
            }
          >
            <span className="w-14 tabular-nums">
              {pos <= 3 ? `${MEDAL[pos - 1]} ${pos}` : isMe ? `▶ ${pos}` : pos}
            </span>
            <span className={'flex-1 truncate ' + (isMe ? 'font-semibold' : '')}>
              {row.name ?? row.email}
              {isMe && <span className="text-muted text-xs ml-2">· tú</span>}
            </span>
            <span className="w-12 text-right tabular-nums">{row.played}</span>
            <span className="w-20 text-right tabular-nums">{row.exact}</span>
            <span className={'w-16 text-right tabular-nums font-display ' + (isMe ? 'text-accent' : '')}>
              {row.points}
            </span>
            <span className="w-6 text-right text-muted">→</span>
          </Link>
        );
      })}
    </div>
  );
}
