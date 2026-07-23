'use client';

import { useState } from 'react';

interface FixtureRow {
  id: string;
  home: string;
  away: string;
  kickoff: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

/**
 * Gestión de partidos del organizador: ver todos, editar/fijar el resultado a
 * mano (como el admin de PADELBOX) y, en competiciones manuales, añadir partidos.
 */
export function FixturesManager({
  slug,
  competitionId,
  provider,
}: {
  slug: string;
  competitionId: string;
  provider: string;
}) {
  const [open, setOpen] = useState(false);
  const [fixtures, setFixtures] = useState<FixtureRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const r = await fetch(`/api/saas/${slug}/competitions/${competitionId}/fixtures`);
      const d = (await r.json()) as { fixtures?: FixtureRow[]; error?: string };
      if (!r.ok) throw new Error(d.error ?? 'Error');
      setFixtures(d.fixtures ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setFixtures([]);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && fixtures === null) load();
  }

  return (
    <div className="mt-3 w-full">
      <button
        type="button"
        onClick={toggle}
        className="h-9 px-4 rounded-lg border border-line text-sm hover:bg-bg"
      >
        {open ? 'Cerrar partidos' : '⚽ Partidos y resultados'}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-line p-4 space-y-3">
          {provider !== 'ESPN' && <AddFixture slug={slug} competitionId={competitionId} onAdded={load} />}
          {error && <p className="text-xs text-danger">{error}</p>}
          {fixtures === null ? (
            <p className="text-sm text-muted">Cargando…</p>
          ) : fixtures.length === 0 ? (
            <p className="text-sm text-muted">
              {provider === 'ESPN'
                ? 'Sin partidos. Usa «Actualizar partidos y puntos» para importarlos.'
                : 'Sin partidos. Añade el primero arriba.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {fixtures.map((f) => (
                <ResultRow key={f.id} slug={slug} f={f} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({ slug, f }: { slug: string; f: FixtureRow }) {
  const [h, setH] = useState<number>(f.homeScore ?? 0);
  const [a, setA] = useState<number>(f.awayScore ?? 0);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function save() {
    setStatus('saving');
    try {
      const r = await fetch(`/api/saas/${slug}/fixtures/${f.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ homeScore: h, awayScore: a }),
      });
      if (!r.ok) throw new Error();
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="flex-1 min-w-0 truncate">
        {f.home} <span className="text-muted">vs</span> {f.away}
      </span>
      <input
        type="number"
        min={0}
        value={h}
        onChange={(e) => setH(Math.max(0, Number(e.target.value) || 0))}
        className="w-12 h-8 rounded border border-line bg-bg text-center tabular-nums"
      />
      <span className="text-muted">–</span>
      <input
        type="number"
        min={0}
        value={a}
        onChange={(e) => setA(Math.max(0, Number(e.target.value) || 0))}
        className="w-12 h-8 rounded border border-line bg-bg text-center tabular-nums"
      />
      <button
        type="button"
        onClick={save}
        disabled={status === 'saving'}
        className={
          'h-8 px-3 rounded text-xs font-semibold disabled:opacity-50 ' +
          (status === 'saved'
            ? 'bg-success/15 text-success border border-success/40'
            : 'bg-accent text-accent-fg')
        }
      >
        {status === 'saving' ? '…' : status === 'saved' ? '✓' : 'Guardar'}
      </button>
    </li>
  );
}

function AddFixture({
  slug,
  competitionId,
  onAdded,
}: {
  slug: string;
  competitionId: string;
  onAdded: () => void;
}) {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [kickoff, setKickoff] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!home.trim() || !away.trim() || !kickoff) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/saas/${slug}/competitions/${competitionId}/fixtures`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ homeTeam: home, awayTeam: away, kickoff: new Date(kickoff).toISOString() }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Error');
      }
      setHome('');
      setAway('');
      setKickoff('');
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-line p-3 space-y-2">
      <p className="text-xs text-muted">Añadir partido a mano</p>
      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Local"
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="h-9 rounded-lg border border-line bg-bg px-2 text-sm flex-1 min-w-[100px]"
        />
        <input
          placeholder="Visitante"
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="h-9 rounded-lg border border-line bg-bg px-2 text-sm flex-1 min-w-[100px]"
        />
        <input
          type="datetime-local"
          value={kickoff}
          onChange={(e) => setKickoff(e.target.value)}
          className="h-9 rounded-lg border border-line bg-bg px-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          disabled={busy}
          className="h-9 px-4 rounded-lg bg-accent text-accent-fg text-sm font-semibold disabled:opacity-50"
        >
          {busy ? '…' : 'Añadir'}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
