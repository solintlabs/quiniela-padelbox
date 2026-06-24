'use client';

import { useMemo, useState } from 'react';

export interface PredItem {
  id: string;
  homeScore: number;
  awayScore: number;
  points: number | null;
  label: string;
  isMe: boolean;
}

function pointsLabel(points: number | null): { text: string; color: string } {
  if (points === 3) return { text: '+3 exacto', color: 'text-success' };
  if (points === 1) return { text: '+1 ganador', color: 'text-warning' };
  if (points === 0) return { text: '0', color: 'text-muted' };
  return { text: 'pendiente', color: 'text-muted' };
}

/**
 * Lista de pronósticos de un partido con orden conmutable:
 *  - "Por puntos": como antes (más puntos arriba).
 *  - "Por marcador": agrupa a quienes pusieron el MISMO marcador, grupos
 *    ordenados por popularidad (el más elegido primero). Así se ve de un
 *    vistazo quién coincidió con quién.
 */
export function MatchPredictionsList({ items }: { items: PredItem[] }) {
  const [mode, setMode] = useState<'puntos' | 'marcador'>('puntos');

  // Conteo por marcador (para ordenar grupos por popularidad).
  const countByScore = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of items) {
      const k = `${p.homeScore}-${p.awayScore}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [items]);

  // Grupos para el modo "por marcador".
  const groups = useMemo(() => {
    const byScore = new Map<string, PredItem[]>();
    for (const p of items) {
      const k = `${p.homeScore}-${p.awayScore}`;
      const arr = byScore.get(k) ?? [];
      arr.push(p);
      byScore.set(k, arr);
    }
    return [...byScore.entries()]
      .map(([k, list]) => {
        const [h, a] = k.split('-').map(Number);
        return { key: k, home: h, away: a, list };
      })
      .sort((x, y) => {
        if (y.list.length !== x.list.length) return y.list.length - x.list.length; // popularidad
        if (x.home !== y.home) return x.home - y.home;
        return x.away - y.away;
      });
  }, [items]);

  const flatByPoints = useMemo(
    () => [...items].sort((a, b) => (b.points ?? -1) - (a.points ?? -1)),
    [items],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-display text-xl">Pronósticos de los demás ({items.length})</h2>
        <div className="inline-flex rounded-lg border border-line p-0.5 bg-bg-elev text-[11px]">
          <button
            type="button"
            onClick={() => setMode('puntos')}
            className={'px-2.5 py-1 rounded-md ' + (mode === 'puntos' ? 'bg-accent text-accent-fg font-semibold' : 'text-muted hover:text-ink')}
          >
            Por puntos
          </button>
          <button
            type="button"
            onClick={() => setMode('marcador')}
            className={'px-2.5 py-1 rounded-md ' + (mode === 'marcador' ? 'bg-accent text-accent-fg font-semibold' : 'text-muted hover:text-ink')}
          >
            Por marcador
          </button>
        </div>
      </div>

      {mode === 'puntos' ? (
        <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
          {flatByPoints.map((p, i) => (
            <Row key={p.id} p={p} border={i > 0} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.key} className="rounded-xl border border-line bg-bg-elev overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-bg border-b border-line">
                <span className="font-display tabular-nums text-base">{g.home}–{g.away}</span>
                <span className="text-[11px] text-muted">
                  {g.list.length} {g.list.length === 1 ? 'persona' : 'personas'}
                  {' · '}
                  {Math.round((g.list.length / items.length) * 100)}%
                </span>
              </div>
              {g.list.map((p, i) => (
                <Row key={p.id} p={p} border={i > 0} hideScore />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Row({ p, border, hideScore }: { p: PredItem; border: boolean; hideScore?: boolean }) {
  const lbl = pointsLabel(p.points);
  return (
    <div className={'flex items-center gap-3 px-4 py-3 ' + (border ? 'border-t border-line ' : '') + (p.isMe ? 'bg-accent/5' : '')}>
      <span className="flex-1 text-sm truncate">
        {p.label}
        {p.isMe && <span className="text-muted text-xs ml-2">· tú</span>}
      </span>
      {!hideScore && (
        <span className="font-display tabular-nums text-lg w-16 text-center">
          {p.homeScore}–{p.awayScore}
        </span>
      )}
      <span className={'text-xs w-20 text-right ' + lbl.color}>{lbl.text}</span>
    </div>
  );
}
