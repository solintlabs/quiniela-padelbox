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
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase tracking-[0.12em] text-muted border-b border-line">
        <tr>
          <th className="text-left py-3 px-2 w-14">#</th>
          <th className="text-left">Jugador</th>
          <th className="text-right tabular-nums w-16">PJ</th>
          <th className="text-right tabular-nums w-20">Exactos</th>
          <th className="text-right tabular-nums w-16">Pts</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((row, i) => {
          const pos = i + 1;
          const isMe = row.userId === meId;
          return (
            <tr
              key={row.userId}
              className={isMe ? 'bg-accent/10 border-y-2 border-accent/40' : undefined}
            >
              <td className="py-3 px-2 tabular-nums">
                {pos <= 3 ? `${MEDAL[pos - 1]} ${pos}` : isMe ? `▶ ${pos}` : pos}
              </td>
              <td className={isMe ? 'font-semibold' : undefined}>
                {row.name ?? row.email}
                {isMe && <span className="text-muted text-xs ml-2">· tú</span>}
              </td>
              <td className="text-right tabular-nums">{row.played}</td>
              <td className="text-right tabular-nums">{row.exact}</td>
              <td className={'text-right tabular-nums font-display ' + (isMe ? 'text-accent' : '')}>
                {row.points}
              </td>
            </tr>
          );
        })}
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} className="py-6 text-center text-muted">
              Aún no hay puntos. ¡Empieza la quiniela!
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
