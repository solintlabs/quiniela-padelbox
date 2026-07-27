'use client';

import Script from 'next/script';
import { useEffect } from 'react';

/**
 * Hueco de anuncio de Google AdSense (web). Monetización del plan gratuito.
 *
 * Se activa solo cuando existe la cuenta de AdSense:
 *   - NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX"
 *   - slot = id del bloque de anuncio creado en AdSense
 * Sin eso (o mientras Google aprueba el sitio) muestra el `fallback`
 * (autopromo de QuinielaBOX), así el hueco nunca queda vacío.
 *
 * Pasos para el dueño: crear cuenta en adsense.google.com, añadir
 * quinielabox.com, esperar aprobación, crear un bloque de anuncio, y poner
 * NEXT_PUBLIC_ADSENSE_CLIENT + el slot en Vercel.
 */
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ slot, fallback }: { slot?: string; fallback?: React.ReactNode }) {
  const enabled = !!CLIENT && !!slot;

  useEffect(() => {
    if (!enabled) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense aún no cargado */
    }
  }, [enabled]);

  if (!enabled) return <>{fallback ?? null}</>;

  return (
    <>
      <Script
        id="adsbygoogle-init"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
      />
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}
