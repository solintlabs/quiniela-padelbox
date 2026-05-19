'use client';

import { useState } from 'react';
import Link from 'next/link';

export function PrintControls() {
  const [hint, setHint] = useState<string | null>(null);

  async function handlePrintOrShare() {
    setHint(null);
    // 1) Intento primario: print del navegador (abre diálogo iOS Safari / Chrome).
    try {
      window.print();
      return;
    } catch {
      // continúa al fallback
    }

    // 2) Fallback: Web Share API (común en iOS dentro de in-app browsers).
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({
          title: 'Mis pronósticos · Quiniela PADELBOX',
          url: window.location.href,
        });
        return;
      } catch {
        // user cancelled, ignorar
      }
    }

    // 3) Sin opciones: muestra hint.
    setHint(
      'Tu navegador no soporta imprimir desde aquí. Usa el menú de compartir del navegador → "Imprimir" o "Guardar como PDF".',
    );
  }

  return (
    <div className="print:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href="/perfil" className="text-sm text-muted hover:text-ink whitespace-nowrap">
          ← Perfil
        </Link>
        <button
          onClick={handlePrintOrShare}
          className="h-10 px-4 sm:px-5 rounded-lg bg-accent text-accent-fg font-semibold text-xs sm:text-sm hover:brightness-95 whitespace-nowrap"
        >
          🖨 Imprimir / Guardar PDF
        </button>
      </div>
      {hint && (
        <p className="text-[11px] text-muted mt-3 max-w-md ml-auto text-right">{hint}</p>
      )}
    </div>
  );
}
