'use client';

import { useState, useTransition } from 'react';

interface Props {
  competitionId: string;
  competitionLabel: string;
  mode: 'disable' | 'enable';
  matchesCount: number;
  predictionsWithPointsCount: number;
  toggleAction: (id: string, mode: 'disable' | 'enable') => Promise<void>;
}

export function CompetitionToggleButton({
  competitionId,
  competitionLabel,
  mode,
  matchesCount,
  predictionsWithPointsCount,
  toggleAction,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    const label = mode === 'disable' ? `Desactivar ${competitionLabel}` : `Reactivar ${competitionLabel}`;
    const cls =
      mode === 'disable'
        ? 'bg-danger text-white hover:brightness-95'
        : 'bg-bg-elev border border-line text-ink hover:bg-bg';
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`px-3 h-9 rounded-md text-xs font-semibold ${cls}`}
      >
        {label}
      </button>
    );
  }

  const isDisable = mode === 'disable';

  return (
    <div className={`rounded-md border-2 p-3 space-y-2 ${isDisable ? 'border-danger/40 bg-danger/10' : 'border-line bg-bg-elev'}`}>
      <p className="text-xs font-semibold">
        {isDisable
          ? `¿Desactivar ${competitionLabel}?`
          : `¿Reactivar ${competitionLabel}?`}
      </p>
      <ul className="text-[11px] text-muted space-y-0.5 list-disc list-inside">
        {isDisable ? (
          <>
            <li>
              {matchesCount} partidos quedan marcados como excluidos del scoring.
            </li>
            <li>
              {predictionsWithPointsCount} predicciones puntuadas pierden sus puntos (quedan en DB como historial).
            </li>
            <li>El ranking deja de contarlos al instante.</li>
          </>
        ) : (
          <>
            <li>{matchesCount} partidos vuelven a entrar al scoring.</li>
            <li>
              Para recalcular puntos de partidos ya FINISHED, pulsa &quot;Recalcular puntos&quot; arriba después.
            </li>
          </>
        )}
      </ul>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => toggleAction(competitionId, mode))}
          className={`px-3 h-8 rounded text-xs font-semibold disabled:opacity-50 ${
            isDisable ? 'bg-danger text-white' : 'bg-accent text-accent-fg'
          }`}
        >
          {pending ? 'Aplicando…' : isDisable ? 'Sí, desactivar' : 'Sí, reactivar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="px-3 h-8 rounded border border-line text-xs"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
