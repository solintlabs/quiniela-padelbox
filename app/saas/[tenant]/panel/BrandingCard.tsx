'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Paquete de marca de la quiniela (plan Pro): portada y lema.
 *
 * En el plan gratuito se muestra igualmente, pero bloqueado y con el aviso de
 * qué desbloquea: enseñar lo que se gana convierte mucho mejor que esconderlo.
 */
export function BrandingCard({
  slug,
  isPro,
  initial,
}: {
  slug: string;
  isPro: boolean;
  initial: { coverUrl: string | null; tagline: string };
}) {
  const router = useRouter();
  const [cover, setCover] = useState<string | null>(initial.coverUrl);
  const [tagline, setTagline] = useState(initial.tagline);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Reduce la portada en el navegador (1600px de ancho) antes de enviarla. */
  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / bitmap.width);
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
      let url = canvas.toDataURL('image/webp', 0.82);
      if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', 0.82);
      if (url.length > 400_000) {
        setError('La imagen pesa demasiado. Prueba con una más pequeña.');
        return;
      }
      setCover(url);
    } catch {
      setError('No se pudo leer la imagen. Usa un PNG o JPG.');
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/saas/${slug}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          coverDataUrl: cover,
          tagline: tagline.trim() || null,
        }),
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
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl">Marca de tu quiniela</h2>
        {!isPro && (
          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/15 text-accent font-bold">
            Pro
          </span>
        )}
      </div>
      <p className="text-sm text-muted">
        Una portada y un lema propios convierten la pantalla en la quiniela de
        tu club, no en una página más. Los ven tus jugadores y quien abra el
        enlace de invitación.
      </p>

      <div className="rounded-xl border border-line overflow-hidden bg-bg">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="Portada" className="w-full h-32 object-cover" />
        ) : (
          <div className="w-full h-32 grid place-items-center text-sm text-muted">
            Sin portada
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={
            'inline-flex items-center h-10 px-4 rounded-lg border border-line text-sm ' +
            (isPro ? 'cursor-pointer hover:bg-bg' : 'opacity-50 cursor-not-allowed')
          }
        >
          {cover ? 'Cambiar portada' : 'Subir portada'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={!isPro}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        {cover && isPro && (
          <button
            type="button"
            onClick={() => setCover(null)}
            className="h-10 px-4 rounded-lg border border-line text-sm text-danger hover:bg-bg"
          >
            Quitar
          </button>
        )}
      </div>

      <label className="block text-sm">
        <span className="text-muted">Lema</span>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={80}
          disabled={!isPro}
          placeholder={isPro ? 'La quiniela oficial del club' : 'Disponible en el plan Pro'}
          className="mt-1 w-full h-11 rounded-lg border border-line bg-bg px-3 disabled:opacity-50"
        />
      </label>

      {isPro ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-10 px-5 rounded-lg bg-accent text-accent-fg text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar marca'}
          </button>
          {saved && <span className="text-xs text-success">✓ Guardado</span>}
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      ) : (
        <p className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2.5 text-sm">
          Sube a <strong>Pro</strong> para poner tu portada y tu lema, quitar los
          anuncios y la marca QuinielaBOX.
        </p>
      )}
    </section>
  );
}
