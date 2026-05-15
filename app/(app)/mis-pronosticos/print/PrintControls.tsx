'use client';

import Link from 'next/link';

export function PrintControls() {
  return (
    <div className="flex items-center justify-between gap-3 print:hidden">
      <Link href="/perfil" className="text-sm text-muted hover:text-ink">
        ← Perfil
      </Link>
      <div className="flex gap-2">
        <button
          onClick={() => window.print()}
          className="h-10 px-5 rounded-lg bg-accent text-accent-fg font-semibold text-sm hover:brightness-95"
        >
          🖨  Imprimir / Guardar PDF
        </button>
      </div>
    </div>
  );
}
