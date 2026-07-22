'use client';

import { useState } from 'react';

/**
 * Botón "Subir a Pro". Pide la Checkout Session al backend y redirige a Stripe.
 * El cobro ocurre en Stripe (web), nunca en la app.
 */
export function UpgradeButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/saas/${slug}/billing/checkout`, { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'No se pudo iniciar el pago');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="h-11 px-6 rounded-lg bg-accent text-accent-fg font-semibold hover:brightness-95 disabled:opacity-50 transition"
      >
        {loading ? 'Redirigiendo a Stripe…' : 'Subir a Pro · $9/mes'}
      </button>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </div>
  );
}
