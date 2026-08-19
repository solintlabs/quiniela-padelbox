'use client';

import { useEffect, useState } from 'react';

interface Player {
  membershipId: string;
  role: 'OWNER' | 'ADMIN' | 'PLAYER';
  hasPaid: boolean;
  email: string | null;
  name: string;
}

/**
 * Tabla de jugadores del organizador: ver quién se apuntó y marcar quién pagó
 * (lo que los habilita a pronosticar). GET/PATCH a /api/saas/[slug]/players.
 */
export function PlayersManager({ slug }: { slug: string }) {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/saas/${slug}/players`);
        const d = (await r.json()) as { players?: Player[]; error?: string };
        if (!r.ok) throw new Error(d.error ?? 'No se pudo cargar');
        if (alive) setPlayers(d.players ?? []);
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Error');
          setPlayers([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  async function togglePaid(p: Player) {
    setBusy(p.membershipId);
    try {
      const r = await fetch(`/api/saas/${slug}/players`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ membershipId: p.membershipId, hasPaid: !p.hasPaid }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Error');
      }
      setPlayers((ps) =>
        (ps ?? []).map((x) => (x.membershipId === p.membershipId ? { ...x, hasPaid: !x.hasPaid } : x)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(null);
    }
  }

  if (players === null) return <p className="text-sm text-muted">Cargando jugadores…</p>;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl">Jugadores</h2>
        <span className="text-xs text-muted">{players.length} apuntados</span>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {players.length === 0 ? (
        <p className="text-sm text-muted rounded-xl border border-line p-5">
          Todavía no se ha apuntado nadie. Comparte tu enlace de invitación.
        </p>
      ) : (
        <ul className="rounded-xl border border-line bg-bg-elev divide-y divide-line overflow-hidden">
          {players.map((p) => (
            <li key={p.membershipId} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate">{p.name}</span>
                {p.email && <span className="block text-xs text-muted truncate">{p.email}</span>}
              </span>
              {p.role !== 'PLAYER' && (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-line text-muted">
                  {p.role === 'OWNER' ? 'Dueño' : 'Admin'}
                </span>
              )}
              {p.role === 'OWNER' ? (
                <span className="text-xs text-success">✓ Organizador</span>
              ) : (
                <button
                  type="button"
                  onClick={() => togglePaid(p)}
                  disabled={busy === p.membershipId}
                  className={
                    'h-8 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ' +
                    (p.hasPaid
                      ? 'bg-success/15 text-success border border-success/40'
                      : 'bg-accent text-accent-fg hover:brightness-95')
                  }
                >
                  {busy === p.membershipId ? '…' : p.hasPaid ? '✓ Pagado' : 'Marcar pagado'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
