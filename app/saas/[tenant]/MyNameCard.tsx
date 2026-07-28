'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * "Cómo te ven en esta quiniela". El jugador elige su propio nombre por
 * quiniela; antes solo podía cambiarlo el organizador.
 */
export function MyNameCard({ slug, initial }: { slug: string; initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/saas/${slug}/me`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim() || null }),
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
    <section className="rounded-xl border border-line bg-bg-elev p-5">
      <h2 className="font-display text-lg">Cómo te ven aquí</h2>
      <p className="text-sm text-muted mt-1 mb-3">
        Tu nombre en el ranking de esta quiniela. Solo afecta a esta.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Tu nombre"
          className="flex-1 h-11 rounded-lg border border-line bg-bg px-3 text-sm"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-11 px-5 rounded-lg bg-accent text-accent-fg text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
      {saved && <p className="text-xs text-success mt-2">✓ Guardado</p>}
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </section>
  );
}
