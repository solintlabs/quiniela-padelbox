'use client';

import { useState } from 'react';

/**
 * Descarga el PNG del cuadro y abre el dialog nativo de compartir (Web Share API).
 * Si el navegador no soporta Web Share, hace download del archivo.
 */
export function ShareImageButton() {
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      const res = await fetch('/api/og/cuadro/me');
      if (!res.ok) throw new Error('No se pudo generar la imagen');
      const blob = await res.blob();
      const file = new File([blob], 'mi-cuadro-mundial-2026.png', { type: 'image/png' });

      // Web Share API (iOS Safari + Android Chrome)
      if (
        typeof navigator !== 'undefined' &&
        'canShare' in navigator &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'Mi cuadro · Quiniela PADELBOX × DELISH',
          text: '¡Mira mi cuadro del Mundial 2026!',
        });
        return;
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mi-cuadro-mundial-2026.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error generando imagen');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-line hover:bg-bg-elev text-sm disabled:opacity-60"
      title="Compartir imagen del cuadro en WhatsApp / IG"
    >
      {loading ? '🎨 Generando…' : '🖼 Compartir imagen'}
    </button>
  );
}
