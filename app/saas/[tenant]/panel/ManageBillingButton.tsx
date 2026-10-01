'use client';

import { useState } from 'react';

/**
 * "Gestionar suscripción". Abre el Customer Portal de Stripe donde el organizador
 * actualiza el método de pago, ve facturas o CANCELA su Pro.
 */
export function ManageBillingButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/saas/${slug}/billing/portal`, { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'No se pudo abrir el portal');
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
        className="h-10 px-5 rounded-lg border border-line text-sm font-semibold hover:bg-bg disabled:opacity-50"
      >
        {loading ? 'Abriendo…' : 'Gestionar suscripción'}
      </button>
      <p className="text-xs text-muted mt-1.5">
        Cambia el método de pago, ve tus facturas o cancela tu plan Pro.
      </p>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
