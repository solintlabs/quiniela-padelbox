'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Ajustes de la quiniela del organizador: nombre, color de acento, logo (Pro)
 * y premios. PATCH a /api/saas/[slug]. Refresca la página al guardar para que
 * el color y el resto se apliquen en todo el panel.
 */
export function TenantSettings({
  slug,
  isPro,
  initial,
}: {
  slug: string;
  isPro: boolean;
  initial: {
    name: string;
    accentColor: string;
    logoUrl: string;
    prizesText: string;
    rulesText: string;
    entryFee: string;
    paymentInfo: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [prizesText, setPrizesText] = useState(initial.prizesText);
  const [rulesText, setRulesText] = useState(initial.rulesText);
  const [entryFee, setEntryFee] = useState(initial.entryFee);
  const [paymentInfo, setPaymentInfo] = useState(initial.paymentInfo);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        accentColor,
        prizesText: prizesText.trim() || null,
        rulesText: rulesText.trim() || null,
        entryFee: entryFee.trim() || null,
        paymentInfo: paymentInfo.trim() || null,
      };
      if (isPro) body.logoUrl = logoUrl.trim() || null;

      const res = await fetch(`/api/saas/${slug}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'No se pudo guardar');
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-bg-elev p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl">Ajustes de tu quiniela</h2>
        <p className="text-sm text-muted mt-1">
          Personaliza cómo la ven tus jugadores.
        </p>
      </div>

      <label className="block text-sm">
        <span className="text-muted">Nombre</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="mt-1 w-full h-10 rounded-lg border border-line bg-bg px-3"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted">Color de acento</span>
        <div className="mt-1 flex items-center gap-3">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-10 w-14 rounded-lg border border-line bg-bg cursor-pointer"
          />
          <input
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-32 h-10 rounded-lg border border-line bg-bg px-3 font-mono text-sm uppercase"
          />
        </div>
      </label>

      <label className="block text-sm">
        <span className="text-muted flex items-center gap-2">
          Logo (URL de imagen)
          {!isPro && (
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/15 text-accent font-bold">
              Pro
            </span>
          )}
        </span>
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          disabled={!isPro}
          placeholder={isPro ? 'https://…/logo.png' : 'Disponible en el plan Pro'}
          className="mt-1 w-full h-10 rounded-lg border border-line bg-bg px-3 disabled:opacity-50"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted">Premios</span>
        <textarea
          value={prizesText}
          onChange={(e) => setPrizesText(e.target.value)}
          maxLength={4000}
          rows={4}
          placeholder={'🥇 1º: …\n🥈 2º: …\n🥉 3º: …'}
          className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 resize-y"
        />
        <span className="text-[11px] text-muted">
          Se muestran a tus jugadores en su tablero. Texto libre.
        </span>
      </label>

      <div className="pt-2 border-t border-line">
        <h3 className="font-display text-base">Inscripción y reglas</h3>
        <p className="text-xs text-muted mt-0.5">
          Lo que ve el jugador para apuntarse. El resumen de puntos se genera solo
          con tu configuración; aquí añades el bote y tus reglas propias.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-muted">Cuota / bote</span>
          <input
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            maxLength={120}
            placeholder="p. ej. $10"
            className="mt-1 w-full h-10 rounded-lg border border-line bg-bg px-3"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="text-muted">Cómo pagar el bote</span>
        <textarea
          value={paymentInfo}
          onChange={(e) => setPaymentInfo(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder={'Instrucciones libres. Los datos de cobro (cuenta, IBAN…) se añaden abajo en «Cómo cobras el bote».'}
          className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 resize-y"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted">Reglas propias (opcional)</span>
        <textarea
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
          maxLength={4000}
          rows={4}
          placeholder={'Se muestran junto al resumen automático de puntos.\nEj.: el bote se reparte 70/20/10, empates a favor del que se apuntó antes…'}
          className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 resize-y"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-10 px-5 rounded-lg bg-accent text-accent-fg text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar ajustes'}
        </button>
        {saved && <span className="text-xs text-success">✓ Guardado</span>}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    </section>
  );
}
