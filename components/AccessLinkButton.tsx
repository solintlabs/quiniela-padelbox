'use client';

import { useState } from 'react';

interface Props {
  userId: string;
  userLabel: string;
  /** Token actual del usuario (null si no tiene). */
  currentToken: string | null;
  generateAction: (formData: FormData) => Promise<void>;
  revokeAction: (formData: FormData) => Promise<void>;
}

export function AccessLinkButton({ userId, userLabel, currentToken, generateAction, revokeAction }: Props) {
  const [copied, setCopied] = useState(false);

  const url =
    currentToken && typeof window !== 'undefined'
      ? `${window.location.origin}/entrar/${currentToken}`
      : currentToken
        ? `https://www.quinielabox.com/entrar/${currentToken}`
        : null;

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  function whatsappShare() {
    if (!url) return;
    const msg = `Hola ${userLabel}! Este es tu acceso directo a la Quiniela PADELBOX. Guárdalo y entra con un toque:\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (!currentToken) {
    return (
      <form action={generateAction}>
        <input type="hidden" name="userId" value={userId} />
        <button type="submit" className="text-[11px] text-accent hover:underline">
          🔗 Generar enlace de acceso
        </button>
      </form>
    );
  }

  return (
    <div className="rounded-md border border-accent/30 bg-accent/5 p-2.5 mt-2 w-full space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-muted">Enlace de acceso directo</p>
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          readOnly
          value={url ?? ''}
          onFocus={(e) => e.target.select()}
          className="flex-1 h-8 rounded border border-line bg-bg-elev px-2 text-[11px] font-mono truncate"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 px-2 h-8 rounded bg-accent text-accent-fg text-[11px] font-semibold"
        >
          {copied ? '✓' : 'Copiar'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={whatsappShare}
          className="text-[11px] text-[#25D366] hover:underline"
        >
          💬 Enviar por WhatsApp
        </button>
        <form action={revokeAction}>
          <input type="hidden" name="userId" value={userId} />
          <button type="submit" className="text-[11px] text-danger hover:underline">
            Revocar
          </button>
        </form>
        <form action={generateAction}>
          <input type="hidden" name="userId" value={userId} />
          <button type="submit" className="text-[11px] text-muted hover:underline">
            Regenerar
          </button>
        </form>
      </div>
      <p className="text-[10px] text-muted">
        ⚠ Quien tenga el link entra a esta cuenta. Compártelo solo con {userLabel}.
      </p>
    </div>
  );
}
