'use client';

import { useState } from 'react';
import { PLANS } from '@/lib/saas/plans';

/**
 * Elección de plan Pro: pago único por temporada (recomendado, convierte mejor
 * en torneos) o suscripción mensual. Pide la Checkout Session al backend y
 * redirige a Stripe. El cobro ocurre en la web, nunca en la app.
 */
export function UpgradeButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState<'season' | 'monthly' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthly = PLANS.PRO.priceUsd ?? 9;
  const season = PLANS.PRO.season;

  async function go(kind: 'season' | 'monthly') {
    setLoading(kind);
    setError(null);
    try {
      const qs = kind === 'season' ? '?plan=season' : '';
      const res = await fetch(`/api/saas/${slug}/billing/checkout${qs}`, { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'No se pudo iniciar el pago');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setLoading(null);
    }
  }

  // Ahorro frente a pagar el mensual durante toda la temporada.
  const saving = season ? monthly * season.months - season.priceUsd : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {season && (
        <button
          type="button"
          onClick={() => go('season')}
          disabled={loading !== null}
          className="text-left rounded-xl border-2 border-accent bg-accent/5 p-4 hover:bg-accent/10 disabled:opacity-50 transition"
        >
          <span className="text-[10px] uppercase tracking-wide font-bold text-accent">
            Recomendado
          </span>
          <span className="block font-display text-2xl mt-1">
            ${season.priceUsd}{' '}
            <span className="text-sm text-muted font-sans">{season.label}</span>
          </span>
          <span className="block text-xs text-muted mt-1">{season.note}</span>
          {saving > 0 && (
            <span className="block text-xs text-success mt-1">Ahorras ${saving}</span>
          )}
          <span className="block text-sm font-semibold mt-3">
            {loading === 'season' ? 'Redirigiendo…' : 'Pagar la temporada →'}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => go('monthly')}
        disabled={loading !== null}
        className="text-left rounded-xl border border-line p-4 hover:bg-bg disabled:opacity-50 transition"
      >
        <span className="text-[10px] uppercase tracking-wide font-bold text-muted">Flexible</span>
        <span className="block font-display text-2xl mt-1">
          ${monthly} <span className="text-sm text-muted font-sans">/mes</span>
        </span>
        <span className="block text-xs text-muted mt-1">Cancela cuando quieras.</span>
        <span className="block text-sm font-semibold mt-3">
          {loading === 'monthly' ? 'Redirigiendo…' : 'Suscribirme →'}
        </span>
      </button>

      {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}
    </div>
  );
}
