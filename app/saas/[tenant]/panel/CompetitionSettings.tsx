'use client';

import { useState } from 'react';

export interface CompRules {
  pointsExact: number;
  pointsWinner: number;
  pointsGoalDiff: number;
  pointsTeamScore: number;
  pointsDrawBonus: number;
  lockOffsetMin: number;
}

const FIELDS: Array<{ key: keyof CompRules; label: string; max: number }> = [
  { key: 'pointsExact', label: 'Marcador exacto', max: 100 },
  { key: 'pointsWinner', label: 'Acertar el ganador', max: 100 },
  { key: 'pointsGoalDiff', label: 'Diferencia de goles', max: 100 },
  { key: 'pointsTeamScore', label: 'Goles por equipo', max: 100 },
  { key: 'pointsDrawBonus', label: 'Bonus por empate', max: 100 },
  { key: 'lockOffsetMin', label: 'Cierre antes del partido (min)', max: 1440 },
];

/**
 * Editor de reglas de una competición: cambiar cuánto vale cada acierto y el
 * margen de cierre, y abrir/cerrar. PATCH a /api/saas/[slug]/competitions/[id].
 */
export function CompetitionSettings({
  slug,
  competitionId,
  status,
  initial,
}: {
  slug: string;
  competitionId: string;
  status: string;
  initial: CompRules;
}) {
  const [open, setOpen] = useState(false);
  const [r, setR] = useState<CompRules>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Partial<CompRules> & { status?: string }) {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/saas/${slug}/competitions/${competitionId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'No se pudo guardar');
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-9 px-4 rounded-lg border border-line text-sm hover:bg-bg"
      >
        {open ? 'Cerrar edición' : '⚙︎ Editar puntos y cierre'}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-line p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted">{f.label}</span>
                <input
                  type="number"
                  min={0}
                  max={f.max}
                  value={r[f.key]}
                  onChange={(e) =>
                    setR((prev) => ({ ...prev, [f.key]: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="w-20 h-9 rounded-lg border border-line bg-bg px-2 text-right tabular-nums"
                />
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => patch(r)}
              disabled={saving}
              className="h-9 px-4 rounded-lg bg-accent text-accent-fg text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar puntos'}
            </button>
            {status === 'OPEN' ? (
              <button
                type="button"
                onClick={() => patch({ status: 'LOCKED' })}
                disabled={saving}
                className="h-9 px-4 rounded-lg border border-line text-sm hover:bg-bg"
              >
                Cerrar quiniela
              </button>
            ) : (
              <button
                type="button"
                onClick={() => patch({ status: 'OPEN' })}
                disabled={saving}
                className="h-9 px-4 rounded-lg border border-line text-sm hover:bg-bg"
              >
                Reabrir quiniela
              </button>
            )}
            {saved && <span className="text-xs text-success">✓ Guardado</span>}
          </div>
          <p className="text-[11px] text-muted">
            Recalcula los puntos ya asignados con «Actualizar partidos y puntos» tras cambiar las reglas.
          </p>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
