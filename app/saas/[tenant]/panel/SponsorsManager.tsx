'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SponsorVM {
  id: string;
  name: string;
  logoUrl: string | null;
  url: string | null;
}

/**
 * Gestión de patrocinadores del tenant (beneficio Pro). Añadir/quitar vía
 * /api/saas/[slug]/sponsors. En FREE solo muestra el candado a Pro.
 */
export function SponsorsManager({
  slug,
  isPro,
  initial,
}: {
  slug: string;
  isPro: boolean;
  initial: SponsorVM[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/saas/${slug}/sponsors`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), logoUrl: logoUrl.trim(), url: url.trim() }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'No se pudo añadir');
      }
      setName('');
      setLogoUrl('');
      setUrl('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      await fetch(`/api/saas/${slug}/sponsors/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-bg-elev p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl">Patrocinadores</h2>
        {!isPro && (
          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/15 text-accent font-bold">
            Pro
          </span>
        )}
      </div>
      <p className="text-sm text-muted">
        Muestra las marcas que patrocinan tu quiniela a todos tus jugadores.
      </p>

      {initial.length > 0 && (
        <ul className="space-y-2">
          {initial.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg px-3 py-2"
            >
              <span className="flex items-center gap-2 min-w-0">
                {s.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt="" className="h-6 w-6 rounded object-contain" />
                )}
                <span className="truncate text-sm">{s.name}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(s.id)}
                disabled={busy}
                className="text-xs text-danger hover:underline disabled:opacity-50"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {isPro ? (
        <div className="space-y-2">
          <div className="grid sm:grid-cols-3 gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              className="h-10 rounded-lg border border-line bg-bg px-3 text-sm"
            />
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="URL del logo (opcional)"
              className="h-10 rounded-lg border border-line bg-bg px-3 text-sm"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enlace (opcional)"
              className="h-10 rounded-lg border border-line bg-bg px-3 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={add}
            disabled={busy || !name.trim()}
            className="h-10 px-5 rounded-lg bg-accent text-accent-fg text-sm font-semibold disabled:opacity-50"
          >
            Añadir patrocinador
          </button>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      ) : (
        <p className="rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-muted">
          Sube a Pro para añadir tus propios patrocinadores.
        </p>
      )}
    </section>
  );
}
