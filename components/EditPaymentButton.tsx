'use client';

import { useState, useTransition } from 'react';

interface Props {
  userId: string;
  currentMethod: string | null;
  currentAmount: string | null;
  currentNote: string | null;
  updateAction: (id: string, method: string, amount: string, note: string) => Promise<void>;
}

export function EditPaymentButton({
  userId,
  currentMethod,
  currentAmount,
  currentNote,
  updateAction,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState(currentMethod ?? '');
  const [amount, setAmount] = useState(currentAmount ?? '');
  const [note, setNote] = useState(currentNote ?? '');
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[11px] text-accent hover:underline mt-2"
      >
        ✎ Editar pago / nota
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1.5 border-t border-success/20 pt-2">
      <input
        type="text"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        placeholder="Método (Zelle, Pago Móvil…)"
        className="w-full h-8 rounded-md border border-line bg-bg px-2 text-xs"
      />
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Monto (ej. 10 USD)"
        className="w-full h-8 rounded-md border border-line bg-bg px-2 text-xs"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={300}
        placeholder="Nota: ej. Activado el 5 jun, pago recibido el 7 jun por Zelle"
        className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-xs resize-y"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateAction(userId, method, amount, note);
              setEditing(false);
            })
          }
          className="px-3 h-7 rounded bg-accent text-accent-fg text-[11px] font-semibold disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => {
            setMethod(currentMethod ?? '');
            setAmount(currentAmount ?? '');
            setNote(currentNote ?? '');
            setEditing(false);
          }}
          disabled={pending}
          className="px-3 h-7 rounded border border-line text-[11px]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
