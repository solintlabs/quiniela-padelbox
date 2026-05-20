'use client';

import { useState, useTransition } from 'react';

interface Props {
  userId: string;
  userLabel: string;
  deleteAction: (id: string) => Promise<void>;
}

export function DeleteUserButton({ userId, userLabel, deleteAction }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[11px] text-danger hover:underline"
      >
        Eliminar usuario
      </button>
    );
  }

  return (
    <div className="rounded-md border border-danger/40 bg-danger/10 p-2 mt-2 text-xs">
      <p className="text-ink mb-2">
        ¿Eliminar a <strong>{userLabel}</strong>? Se borrarán sus pronósticos, sesiones y push tokens. No se puede deshacer.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => deleteAction(userId))}
          className="px-2 py-1 rounded bg-danger text-white text-xs font-semibold disabled:opacity-50"
        >
          {pending ? 'Borrando…' : 'Sí, eliminar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="px-2 py-1 rounded border border-line text-xs"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
