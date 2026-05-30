'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MoreSheetProps {
  isAdmin: boolean;
  userEmail?: string | null;
  signOutAction: () => Promise<void>;
}

/**
 * Bottom sheet con los enlaces secundarios que no caben en el tab bar
 * (Ranking, Reglas, Cuadro, Admin, Salir, etc). Se abre desde el tab "Más"
 * del BottomQuickNav. Drawer estilo iOS, full-width en mobile.
 */
export function MoreSheet({ isAdmin, userEmail, signOutAction }: MoreSheetProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Más opciones"
        onClick={() => setOpen(true)}
        className="sm:hidden flex flex-col items-center justify-center gap-1 py-2 text-[10px] text-muted hover:text-ink w-full"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        <span className="leading-none font-medium">Más</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="sm:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-line rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Menú</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-line text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 pb-4">
              <SheetItem href="/ranking" emoji="🏆" label="Ranking" onClick={() => setOpen(false)} />
              <SheetItem href="/cuadro" emoji="🎯" label="Mi Cuadro" onClick={() => setOpen(false)} />
              <SheetItem href="/reglas" emoji="📖" label="Reglas" onClick={() => setOpen(false)} />
              <SheetItem href="/mis-pronosticos" emoji="📋" label="Mis pronósticos" onClick={() => setOpen(false)} />
              <SheetItem href="/soporte" emoji="💬" label="Soporte" onClick={() => setOpen(false)} />
              {isAdmin && (
                <SheetItem href="/admin" emoji="⚙️" label="Admin" accent onClick={() => setOpen(false)} />
              )}
            </div>

            <div className="px-4 pb-4 border-t border-line pt-3">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg border border-danger/40 bg-danger/10 text-danger text-sm font-semibold hover:bg-danger/15"
                >
                  Cerrar sesión
                </button>
                {userEmail && (
                  <p className="text-[10px] text-muted text-center mt-2 truncate">{userEmail}</p>
                )}
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function SheetItem({
  href,
  emoji,
  label,
  accent,
  onClick,
}: {
  href: string;
  emoji: string;
  label: string;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={
        'aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center text-[11px] leading-tight ' +
        (accent
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-line bg-bg-elev text-ink hover:bg-bg')
      }
    >
      <span className="text-2xl" aria-hidden>{emoji}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
