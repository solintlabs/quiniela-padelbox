'use client';

import { useState, useTransition } from 'react';

interface Props {
  userId: string;
  currentName: string | null;
  currentPhone: string | null;
  currentEmail: string;
  updateAction: (id: string, name: string, phone: string, email: string) => Promise<void>;
}

export function EditUserButton({ userId, currentName, currentPhone, currentEmail, updateAction }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName ?? '');
  const [phone, setPhone] = useState(currentPhone ?? '');
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[11px] text-accent hover:underline"
      >
        ✎ Editar datos
      </button>
    );
  }

  return (
    <div className="rounded-md border border-accent/40 bg-accent/5 p-3 mt-2 space-y-2">
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-muted">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Nombre del participante"
          className="w-full h-9 rounded-md border border-line bg-bg-elev px-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-muted">Teléfono / WhatsApp</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
          placeholder="+58 4141234567"
          className="w-full h-9 rounded-md border border-line bg-bg-elev px-2 text-sm font-mono"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-muted">Email (login)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={120}
          placeholder="correo@ejemplo.com"
          className="w-full h-9 rounded-md border border-warning/40 bg-bg-elev px-2 text-sm"
        />
        <p className="text-[10px] text-warning">
          ⚠ El email es con el que el usuario inicia sesión. Cámbialo solo si es necesario.
        </p>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await updateAction(userId, name, phone, email);
                setEditing(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'No se pudo guardar');
              }
            });
          }}
          className="px-3 h-8 rounded bg-accent text-accent-fg text-xs font-semibold disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => {
            setName(currentName ?? '');
            setPhone(currentPhone ?? '');
            setEmail(currentEmail);
            setError(null);
            setEditing(false);
          }}
          disabled={pending}
          className="px-3 h-8 rounded border border-line text-xs"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
