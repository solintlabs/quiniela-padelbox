'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format';

export interface PredRow {
  id: string;
  matchId: string;
  stageLabel: string;
  kickoff: string; // ISO
  homeTeam: string;
  awayTeam: string;
  predHome: number;
  predAway: number;
  realHome: number | null;
  realAway: number | null;
  finished: boolean;
  points: number | null;
}

/**
 * Lista de pronósticos de un jugador con orden conmutable. Por defecto muestra
 * los más recientes arriba (así el último partido se ve sin bajar toda la
 * tabla). El usuario puede invertir a "más antiguos primero".
 */
export function UserPredictionsList({ rows }: { rows: PredRow[] }) {
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
    return desc ? copy.reverse() : copy;
  }, [rows, desc]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted">{rows.length} pronóstico{rows.length !== 1 && 's'}</p>
        <button
          type="button"
          onClick={() => setDesc((d) => !d)}
          className="text-[11px] px-2.5 py-1.5 rounded-md border border-line text-muted hover:text-ink hover:bg-bg inline-flex items-center gap-1.5"
        >
          <span aria-hidden>{desc ? '▼' : '▲'}</span>
          {desc ? 'Más recientes primero' : 'Más antiguos primero'}
        </button>
      </div>

      <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
        {sorted.map((p, i) => (
          <Link
            key={p.id}
            href={`/partidos/${p.matchId}`}
            className={'flex items-center gap-3 px-4 py-3 hover:bg-bg ' + (i > 0 ? 'border-t border-line' : '')}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted">{p.stageLabel} · {formatDateTime(p.kickoff)}</p>
              <p className="text-sm truncate">
                {p.homeTeam} <span className="text-muted">vs</span> {p.awayTeam}
              </p>
            </div>
            <span className="font-display tabular-nums text-base w-14 text-center">
              {p.predHome}–{p.predAway}
            </span>
            <span className="font-display tabular-nums text-xs w-16 text-right text-muted">
              {p.finished && p.realHome !== null ? `${p.realHome}–${p.realAway}` : '—'}
            </span>
            <span
              className={
                'text-xs w-16 text-right font-semibold ' +
                (p.points === 3 ? 'text-success' : p.points === 1 ? 'text-warning' : 'text-muted')
              }
            >
              {p.points === null ? '—' : `+${p.points} pts`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
