'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * El organizador fija el equipo campeón al terminar el torneo. Al guardar,
 * quien lo acertó en su pick suma el bonus (se refleja al recalcular puntos).
 */
export function ChampionWinner({
  slug,
  competitionId,
  teams,
  currentWinnerId,
}: {
  slug: string;
  competitionId: string;
  teams: Array<{ id: string; name: string }>;
  currentWinnerId: string | null;
}) {
  const router = useRouter();
  const [winner, setWinner] = useState(currentWinnerId ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/saas/${slug}/competitions/${competitionId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ championWinnerTeamId: winner || null }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'No se pudo guardar');
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-line p-4">
      <p className="text-sm font-semibold flex items-center gap-2">🏆 Campeón del torneo</p>
      <p className="text-xs text-muted mt-0.5 mb-2">
        Fíjalo cuando acabe el torneo. Quien lo acertó suma el bonus.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={winner}
          onChange={(e) => setWinner(e.target.value)}
          className="flex-1 h-10 rounded-lg border border-line bg-bg px-3 text-sm"
        >
          <option value="">Sin decidir</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-10 px-4 rounded-lg bg-accent text-accent-fg text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Fijar campeón'}
        </button>
      </div>
      <p className="text-[11px] text-muted mt-2">
        Tras fijarlo, pulsa «Actualizar partidos y puntos» para recalcular.
      </p>
      {saved && <p className="text-xs text-success mt-1">✓ Guardado</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
