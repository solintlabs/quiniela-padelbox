'use client';

import { useState } from 'react';

/**
 * Enlace de invitación con botones fáciles de compartir (WhatsApp, email,
 * copiar y compartir nativo). El organizador reparte esto para llenar su
 * quiniela. Recibe la URL absoluta ya construida en el servidor.
 */
export function InviteShare({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);

  const message = `¡Únete a la quiniela "${name}"! Pronostica los partidos y compite por el bote 👉 ${url}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const mail = `mailto:?subject=${encodeURIComponent(`Únete a la quiniela ${name}`)}&body=${encodeURIComponent(message)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard no disponible */
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: message, url });
      } catch {
        /* cancelado */
      }
    } else {
      copy();
    }
  }

  return (
    <section className="rounded-xl border border-line bg-bg-elev p-5">
      <h2 className="font-display text-lg">Invita a tus jugadores</h2>
      <p className="text-sm text-muted mt-1">
        Comparte este enlace. Quien entre queda apuntado, y tú confirmas quién
        pagó el bote.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 h-11 rounded-lg bg-bg border border-line px-3 text-sm font-mono"
        />
        <button
          type="button"
          onClick={copy}
          className="h-11 px-4 rounded-lg border border-line text-sm shrink-0 hover:bg-bg"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-11 px-4 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.6.2-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.6-1.5-.9-2.1-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3M12 21.5a9.5 9.5 0 01-4.8-1.3l-.4-.2-3.6.9.9-3.5-.2-.4A9.5 9.5 0 1121.5 12 9.5 9.5 0 0112 21.5M12 2a10 10 0 00-8.6 15l-1.3 4.9 5-1.3A10 10 0 1012 2" />
          </svg>
          WhatsApp
        </a>
        <a
          href={mail}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-lg border border-line text-sm font-semibold hover:bg-bg"
        >
          ✉️ Email
        </a>
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-lg border border-line text-sm font-semibold hover:bg-bg"
        >
          🔗 Compartir…
        </button>
      </div>
    </section>
  );
}
