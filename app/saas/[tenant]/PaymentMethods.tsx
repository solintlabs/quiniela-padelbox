'use client';

import { useState } from 'react';

export interface PlayerPaymentMethod {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  fields: Array<{ label: string; value: string; mono?: boolean }>;
}

/**
 * Métodos de pago que ve el jugador para pagar el bote, con botón de copiar
 * en cada dato (número de teléfono, correo de Zelle…). Igual que PADELBOX.
 */
export function PaymentMethods({ methods }: { methods: PlayerPaymentMethod[] }) {
  if (methods.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg">Cómo pagar el bote</h2>
      <div className="grid gap-2">
        {methods.map((m) => (
          <article key={m.id} className="rounded-xl border border-line bg-bg-elev p-4">
            <p className="text-sm font-semibold">
              {m.icon ? `${m.icon} ` : ''}
              {m.title}
              {m.subtitle ? <span className="text-muted font-normal"> · {m.subtitle}</span> : null}
            </p>
            <ul className="mt-2 space-y-1.5">
              {m.fields.map((f) => (
                <Row key={f.label} label={f.label} value={f.value} />
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* sin portapapeles */
    }
  }
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted shrink-0">{label}</span>
      <span className="flex items-center gap-2 min-w-0">
        <span className="font-mono truncate">{value}</span>
        <button
          type="button"
          onClick={copy}
          className="text-xs text-accent hover:underline shrink-0"
        >
          {copied ? '✓' : 'Copiar'}
        </button>
      </span>
    </li>
  );
}
