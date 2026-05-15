'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';

interface MatchInForm {
  id: string;
  group: string | null;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string | null;
  awayFlag: string | null;
  isLocked: boolean;
  initial?: { homeScore: number; awayScore: number } | null;
}

interface Props {
  matches: MatchInForm[];
  total: number;
}

type Scores = Record<string, { homeScore: number; awayScore: number }>;

function clamp(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(20, Math.floor(n)));
}

export function BatchGroupForm({ matches, total }: Props) {
  const router = useRouter();
  const [scores, setScores] = useState<Scores>(() => {
    const initial: Scores = {};
    for (const m of matches) {
      if (m.initial) initial[m.id] = { ...m.initial };
    }
    return initial;
  });
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ saved: number; skipped: { matchId: string; reason: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, MatchInForm[]>();
    for (const m of matches) {
      const key = m.group ?? '?';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, items]) => ({
        group,
        items: items.sort((x, y) => new Date(x.kickoff).getTime() - new Date(y.kickoff).getTime()),
      }));
  }, [matches]);

  const filled = Object.keys(scores).length;

  function setScore(id: string, side: 'h' | 'a', value: number) {
    setScores((prev) => {
      const cur = prev[id] ?? { homeScore: 0, awayScore: 0 };
      return {
        ...prev,
        [id]: side === 'h' ? { ...cur, homeScore: clamp(value) } : { ...cur, awayScore: clamp(value) },
      };
    });
  }

  function submit() {
    const predictions = Object.entries(scores)
      .filter(([id]) => {
        const m = matches.find((x) => x.id === id);
        return m && !m.isLocked;
      })
      .map(([matchId, s]) => ({ matchId, homeScore: s.homeScore, awayScore: s.awayScore }));

    if (predictions.length === 0) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/predictions/batch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ predictions }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message ?? body.error ?? 'No se pudo guardar');
        setResult(body);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Sticky progress + save bar */}
      <div className="sticky top-14 z-30 -mx-6 px-6 py-3 bg-bg/90 backdrop-blur border-b border-line flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Progreso</p>
          <p className="font-display text-2xl tabular-nums">
            <span className="text-accent">{filled}</span>
            <span className="text-muted"> / {total}</span>
          </p>
        </div>
        <Button onClick={submit} disabled={pending || filled === 0} className="px-6">
          {pending ? 'Guardando…' : 'Guardar todo'}
        </Button>
      </div>

      {result && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm">
          ✓ Guardados <strong>{result.saved}</strong> pronósticos.
          {result.skipped.length > 0 && (
            <p className="mt-1 text-xs text-muted">
              {result.skipped.length} no se guardaron (partidos cerrados durante la edición).
            </p>
          )}
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      {grouped.map(({ group, items }) => (
        <section key={group}>
          <h2 className="font-display text-2xl mb-3">Grupo {group}</h2>
          <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
            {items.map((m, i) => (
              <MatchRow
                key={m.id}
                match={m}
                isFirst={i === 0}
                value={scores[m.id]}
                onChange={(side, v) => setScore(m.id, side, v)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MatchRow({
  match,
  isFirst,
  value,
  onChange,
}: {
  match: MatchInForm;
  isFirst: boolean;
  value?: { homeScore: number; awayScore: number };
  onChange: (side: 'h' | 'a', v: number) => void;
}) {
  const home = value?.homeScore ?? 0;
  const away = value?.awayScore ?? 0;
  const filled = !!value;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-3 sm:px-4',
        !isFirst && 'border-t border-line',
        match.isLocked && 'opacity-50',
        filled && !match.isLocked && 'bg-accent/5',
      )}
    >
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {match.homeFlag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={match.homeFlag} alt="" className="w-5 h-5 rounded-sm shrink-0 object-cover" />
        )}
        <span className="text-sm truncate flex-1">{match.homeTeam}</span>
      </div>

      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={0}
        max={20}
        value={home}
        onChange={(e) => onChange('h', Number(e.target.value))}
        onFocus={(e) => e.target.select()}
        disabled={match.isLocked}
        className={cn(
          'w-10 h-10 rounded-md border bg-bg text-center font-display text-lg tabular-nums',
          filled ? 'border-accent/40 bg-accent/10' : 'border-line',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
        )}
      />
      <span className="text-muted text-sm">–</span>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={0}
        max={20}
        value={away}
        onChange={(e) => onChange('a', Number(e.target.value))}
        onFocus={(e) => e.target.select()}
        disabled={match.isLocked}
        className={cn(
          'w-10 h-10 rounded-md border bg-bg text-center font-display text-lg tabular-nums',
          filled ? 'border-accent/40 bg-accent/10' : 'border-line',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
        )}
      />

      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span className="text-sm truncate text-right flex-1">{match.awayTeam}</span>
        {match.awayFlag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={match.awayFlag} alt="" className="w-5 h-5 rounded-sm shrink-0 object-cover" />
        )}
      </div>

      {match.isLocked && (
        <span className="ml-2 text-[10px] uppercase tracking-wider text-muted hidden sm:inline">
          Cerrado
        </span>
      )}
    </div>
  );
}
