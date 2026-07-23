'use client';

import { useState } from 'react';

/**
 * Botón del organizador para importar partidos/resultados y puntuar a demanda,
 * sin esperar al cron. POST a /api/saas/[slug]/competitions/[id]/sync.
 */
export function SyncButton({ slug, competitionId }: { slug: string; competitionId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/saas/${slug}/competitions/${competitionId}/sync`, {
        method: 'POST',
      });
      const d = (await res.json().catch(() => ({}))) as {
        error?: string;
        imported?: { fixturesCreated?: number } | null;
        scored?: number;
      };
      if (!res.ok) throw new Error(d.error ?? 'No se pudo actualizar');
      window.location.reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="h-9 px-4 rounded-lg border border-line text-sm hover:bg-bg disabled:opacity-50"
      >
        {busy ? 'Actualizando…' : '↻ Actualizar partidos y puntos'}
      </button>
      {msg && <p className="text-xs text-danger mt-1">{msg}</p>}
    </div>
  );
}
