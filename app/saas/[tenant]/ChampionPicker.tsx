'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ChampionTeam {
  id: string;
  name: string;
  logoUrl: string | null;
}

/**
 * "Tu campeón del torneo". El jugador elige un equipo; se congela al arrancar
 * el primer partido. Cuando el organizador fija el ganador, muestra si acertó.
 */
export function ChampionPicker({
  slug,
  competitionId,
  bonus,
  teams,
  currentTeamId,
  locked,
  winnerTeamId,
  canPredict,
}: {
  slug: string;
  competitionId: string;
  bonus: number;
  teams: ChampionTeam[];
  currentTeamId: string | null;
  locked: boolean;
  winnerTeamId: string | null;
  canPredict: boolean;
}) {
  const router = useRouter();
  const [teamId, setTeamId] = useState(currentTeamId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = teams.find((t) => t.id === currentTeamId) ?? null;
  const winner = teams.find((t) => t.id === winnerTeamId) ?? null;
  const decided = !!winnerTeamId;
  const correct = decided && !!currentTeamId && currentTeamId === winnerTeamId;

  async function save() {
    if (!teamId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/saas/${slug}/competitions/${competitionId}/champion`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'No se pudo guardar');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">🏆</span>
        <h2 className="font-display text-xl">Tu campeón del torneo</h2>
      </div>
      <p className="text-sm text-muted mt-1">
        Elige quién levantará el trofeo. Aciertas = <strong>+{bonus} pts</strong>. Se
        cierra cuando arranca el primer partido.
      </p>

      {decided ? (
        <div className="mt-4 space-y-1">
          <p className="text-sm">
            Campeón: <strong>{winner?.name ?? '—'}</strong>
          </p>
          <p className="text-sm">
            Tu pick: <strong>{current?.name ?? 'Sin elegir'}</strong>{' '}
            {correct ? (
              <span className="text-success font-semibold">✓ +{bonus} pts</span>
            ) : (
              <span className="text-muted">sin bonus</span>
            )}
          </p>
        </div>
      ) : locked ? (
        <p className="mt-4 text-sm">
          Tu campeón: <strong>{current?.name ?? 'No elegiste a tiempo'}</strong>{' '}
          <span className="text-muted">(cerrado)</span>
        </p>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            disabled={!canPredict}
            className="flex-1 h-11 rounded-lg border border-line bg-bg px-3 text-sm disabled:opacity-50"
          >
            <option value="">Elige un equipo…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={save}
            disabled={saving || !teamId || !canPredict}
            className="h-11 px-5 rounded-lg bg-accent text-accent-fg text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Guardando…' : current ? 'Cambiar' : 'Elegir campeón'}
          </button>
        </div>
      )}
      {!canPredict && !decided && !locked && (
        <p className="mt-2 text-xs text-muted">
          Podrás elegir cuando el organizador confirme tu inscripción.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </section>
  );
}
