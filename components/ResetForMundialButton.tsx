'use client';

import { useState, useTransition } from 'react';

interface Props {
  ligaMatchesCount: number;
  affectedPredictionsCount: number;
  resetAction: () => Promise<void>;
}

export function ResetForMundialButton({ ligaMatchesCount, affectedPredictionsCount, resetAction }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="px-4 h-10 rounded-lg bg-danger text-white text-sm font-semibold hover:brightness-95"
      >
        🧹 Preparar para Mundial (Reset Liga + puntos a 0)
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-danger/40 bg-danger/10 p-4 space-y-3">
      <p className="text-sm">
        <strong>⚠️ Vas a:</strong>
      </p>
      <ul className="text-xs text-ink space-y-1 list-disc list-inside">
        <li>
          Excluir <strong>{ligaMatchesCount} partidos de La Liga</strong> del scoring (pasados y futuros).
        </li>
        <li>
          Anular los puntos de <strong>{affectedPredictionsCount} predicciones</strong> ya puntuadas.
        </li>
        <li>
          Las <strong>predicciones quedan en DB</strong> como histórico — solo desaparecen del ranking.
        </li>
        <li>
          Los partidos del <strong>Mundial NO se tocan</strong> — siguen funcionando normal.
        </li>
      </ul>
      <p className="text-xs text-muted">
        Esto se puede revertir manualmente en DB si fuera necesario, pero idealmente solo se hace una vez antes del Mundial.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => resetAction())}
          className="px-3 h-9 rounded bg-danger text-white text-xs font-semibold disabled:opacity-50"
        >
          {pending ? 'Aplicando…' : 'Sí, resetear todo'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="px-3 h-9 rounded border border-line text-xs"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
