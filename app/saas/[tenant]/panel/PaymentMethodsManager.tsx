'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface PaymentMethodVM {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  fields: Array<{ label: string; value: string }>;
}

/**
 * Métodos de pago del tenant (Pago Móvil, Zelle, Binance…). El jugador los ve
 * al inscribirse con botón de copiar, como en PADELBOX.
 */
export function PaymentMethodsManager({
  slug,
  initial,
}: {
  slug: string;
  initial: PaymentMethodVM[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [icon, setIcon] = useState('');
  const [fields, setFields] = useState<Array<{ label: string; value: string }>>([
    { label: '', value: '' },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/saas/${slug}/payment-methods`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          icon: icon.trim() || undefined,
          fields: fields.filter((f) => f.label.trim() && f.value.trim()),
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'No se pudo añadir');
      }
      setTitle('');
      setSubtitle('');
      setIcon('');
      setFields([{ label: '', value: '' }]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/saas/${slug}/payment-methods/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-bg-elev p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl">Métodos de pago</h2>
        <p className="text-sm text-muted mt-1">
          Cómo te pagan el bote tus jugadores. Los verán al inscribirse, con botón
          de copiar.
        </p>
      </div>

      {initial.length > 0 && (
        <ul className="space-y-2">
          {initial.map((m) => (
            <li key={m.id} className="rounded-lg border border-line bg-bg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {m.icon ? `${m.icon} ` : ''}
                    {m.title}
                    {m.subtitle ? <span className="text-muted font-normal"> · {m.subtitle}</span> : null}
                  </p>
                  {m.fields.map((f) => (
                    <p key={f.label} className="text-xs text-muted mt-0.5">
                      {f.label}: <span className="font-mono">{f.value}</span>
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  disabled={busy}
                  className="text-xs text-danger hover:underline disabled:opacity-50 shrink-0"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t border-line pt-4">
        <div className="grid sm:grid-cols-3 gap-2">
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📲"
            maxLength={8}
            className="h-10 rounded-lg border border-line bg-bg px-3 text-sm"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Pago Móvil"
            className="h-10 rounded-lg border border-line bg-bg px-3 text-sm"
          />
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Banesco (opcional)"
            className="h-10 rounded-lg border border-line bg-bg px-3 text-sm"
          />
        </div>

        {fields.map((f, i) => (
          <div key={i} className="grid sm:grid-cols-2 gap-2">
            <input
              value={f.label}
              onChange={(e) =>
                setFields((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
              }
              placeholder="Teléfono"
              className="h-10 rounded-lg border border-line bg-bg px-3 text-sm"
            />
            <input
              value={f.value}
              onChange={(e) =>
                setFields((prev) => prev.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
              }
              placeholder="0412-1234567"
              className="h-10 rounded-lg border border-line bg-bg px-3 text-sm font-mono"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFields((p) => [...p, { label: '', value: '' }])}
          className="text-xs text-accent hover:underline"
        >
          + Añadir dato
        </button>

        <div>
          <button
            type="button"
            onClick={add}
            disabled={busy || !title.trim()}
            className="h-10 px-5 rounded-lg bg-accent text-accent-fg text-sm font-semibold disabled:opacity-50"
          >
            Añadir método de pago
          </button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </section>
  );
}
