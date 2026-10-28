'use client';

import { useState } from 'react';

interface League {
  slug: string;
  name: string;
}

/**
 * Crear una competición dentro de una quiniela existente. Recupera tenants que
 * se quedaron sin competición y permite añadir varias (según el plan). Busca en
 * el catálogo ESPN o crea una manual. POST /api/saas/[slug]/competitions.
 */
export function AddCompetition({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'ESPN' | 'MANUAL'>('ESPN');
  const [query, setQuery] = useState('');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(q: string) {
    setQuery(q);
    setLeague(null);
    if (q.trim().length < 2) {
      setLeagues([]);
      return;
    }
    try {
      const r = await fetch(`/api/saas/leagues?q=${encodeURIComponent(q)}`);
      const b = (await r.json()) as { leagues?: League[] };
      setLeagues(b.leagues ?? []);
    } catch {
      setLeagues([]);
    }
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const body =
        mode === 'ESPN'
          ? { name: name.trim() || league?.name || 'Mi competición', provider: 'ESPN', espnSlug: league?.slug }
          : { name: name.trim() || 'Mi competición', provider: 'MANUAL' };
      const r = await fetch(`/api/saas/${slug}/competitions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? 'No se pudo crear');
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setBusy(false);
    }
  }

  const canCreate = mode === 'ESPN' ? !!league : name.trim().length >= 2;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 h-10 px-4 rounded-lg bg-accent text-accent-fg font-display tracking-tight text-sm"
      >
        + Crear competición
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-bg-elev p-4 space-y-3">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode('ESPN')}
          className={`h-8 px-3 rounded-lg border ${mode === 'ESPN' ? 'border-accent text-accent' : 'border-line text-muted'}`}
        >
          Del catálogo
        </button>
        <button
          type="button"
          onClick={() => setMode('MANUAL')}
          className={`h-8 px-3 rounded-lg border ${mode === 'MANUAL' ? 'border-accent text-accent' : 'border-line text-muted'}`}
        >
          A mano
        </button>
      </div>

      {mode === 'ESPN' && (
        <div>
          <input
            placeholder="Busca tu liga (LaLiga, Premier, Libertadores…)"
            value={query}
            onChange={(e) => search(e.target.value)}
            className="w-full h-10 rounded-lg border border-line bg-bg px-3 text-sm"
          />
          {leagues.length > 0 && !league && (
            <ul className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-line divide-y divide-line">
              {leagues.map((l) => (
                <li key={l.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setLeague(l);
                      setName(l.name);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-bg"
                  >
                    {l.name} <span className="text-muted font-mono text-xs ml-1">{l.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {league && (
            <p className="mt-2 text-sm text-accent">
              ✓ {league.name}{' '}
              <button type="button" onClick={() => setLeague(null)} className="text-muted text-xs underline ml-1">
                cambiar
              </button>
            </p>
          )}
        </div>
      )}

      <input
        placeholder="Nombre de la competición"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full h-10 rounded-lg border border-line bg-bg px-3 text-sm"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={create}
          disabled={busy || !canCreate}
          className="h-10 px-5 rounded-lg bg-accent text-accent-fg font-semibold text-sm disabled:opacity-50"
        >
          {busy ? 'Creando…' : 'Crear'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 px-4 rounded-lg border border-line text-sm">
          Cancelar
        </button>
      </div>
      <p className="text-[11px] text-muted">
        Los puntos se pueden ajustar luego en «Editar puntos». Tras crear, dale a «Actualizar partidos y puntos».
      </p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
