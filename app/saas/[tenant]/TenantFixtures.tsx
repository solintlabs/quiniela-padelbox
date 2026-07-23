'use client';

import { useState } from 'react';

export interface FixtureVM {
  id: string;
  home: string;
  away: string;
  kickoff: string;
  round: string | null;
  closed: boolean;
  homeScore: number | null;
  awayScore: number | null;
  myHome: number | null;
  myAway: number | null;
  points: number | null;
}

/**
 * Lista de partidos del jugador. Los abiertos se pueden pronosticar (steppers +
 * guardar → POST /api/saas/[slug]/entries); los cerrados se muestran de solo
 * lectura con el resultado y los puntos.
 */
export function TenantFixtures({
  slug,
  canPredict,
  fixtures,
}: {
  slug: string;
  canPredict: boolean;
  fixtures: FixtureVM[];
}) {
  if (fixtures.length === 0) {
    return (
      <p className="text-sm text-muted rounded-xl border border-line p-5">
        No hay partidos todavía. Aparecerán en cuanto se sincronicen.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {fixtures.map((f) => (
        <Row key={f.id} slug={slug} canPredict={canPredict} f={f} />
      ))}
    </ul>
  );
}

function Row({ slug, canPredict, f }: { slug: string; canPredict: boolean; f: FixtureVM }) {
  const [h, setH] = useState<number>(f.myHome ?? 0);
  const [a, setA] = useState<number>(f.myAway ?? 0);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const editable = canPredict && !f.closed;

  async function save() {
    setStatus('saving');
    setError(null);
    try {
      const res = await fetch(`/api/saas/${slug}/entries`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fixtureId: f.id, homeScore: h, awayScore: a }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error ?? 'No se pudo guardar');
      }
      setStatus('saved');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <li className="rounded-xl border border-line bg-bg-elev p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {f.home} <span className="text-muted">vs</span> {f.away}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {f.kickoff}
            {f.round ? ` · ${f.round}` : ''}
          </p>
        </div>
        <div className="text-right shrink-0">
          {f.homeScore !== null && f.awayScore !== null ? (
            <p className="font-display text-lg tabular-nums">
              {f.homeScore}–{f.awayScore}
            </p>
          ) : (
            <p className="text-xs text-muted">{f.closed ? 'Cerrado' : 'Abierto'}</p>
          )}
        </div>
      </div>

      {editable ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Stepper value={h} onChange={setH} label={`goles de ${f.home}`} />
            <span className="text-muted font-display">–</span>
            <Stepper value={a} onChange={setA} label={`goles de ${f.away}`} />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={status === 'saving'}
            className={
              'h-9 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ' +
              (status === 'saved'
                ? 'bg-success/15 text-success border border-success/40'
                : 'bg-accent text-accent-fg hover:brightness-95')
            }
          >
            {status === 'saving' ? 'Guardando…' : status === 'saved' ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      ) : (
        (f.myHome !== null || f.points !== null) && (
          <p className="text-xs text-muted tabular-nums mt-2">
            Tu pronóstico: {f.myHome ?? '–'}–{f.myAway ?? '–'}
            {f.points !== null && ` · +${f.points} pts`}
          </p>
        )
      )}
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </li>
  );
}

function Stepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(20, n));
  return (
    <div className="inline-flex items-center rounded-lg border border-line overflow-hidden">
      <button
        type="button"
        aria-label={`Bajar ${label}`}
        onClick={() => onChange(clamp(value - 1))}
        className="w-8 h-9 hover:bg-bg text-muted"
      >
        −
      </button>
      <span className="w-8 text-center font-display tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={`Subir ${label}`}
        onClick={() => onChange(clamp(value + 1))}
        className="w-8 h-9 hover:bg-bg text-muted"
      >
        +
      </button>
    </div>
  );
}
