'use client';

import { useEffect, useState } from 'react';

interface Props {
  /** id del contenedor que tiene los elementos con [data-search] */
  scopeId: string;
  placeholder?: string;
  className?: string;
}

/** Normaliza para comparar: minúsculas y sin acentos (búsqueda "jose" → "José"). */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * Buscador interactivo client-side: filtra al instante (con cada letra) los
 * elementos `[data-search]` dentro de #scopeId, sin ida al servidor. Las filas
 * siguen siendo server components (forms y actions intactos) — solo se les
 * pone/quita la clase `hidden`.
 */
export function LiveSearch({ scopeId, placeholder = 'Buscar…', className }: Props) {
  const [q, setQ] = useState('');
  const [counts, setCounts] = useState<{ shown: number; total: number } | null>(null);

  useEffect(() => {
    const scope = document.getElementById(scopeId);
    if (!scope) return;

    const apply = () => {
      const rows = Array.from(scope.querySelectorAll<HTMLElement>('[data-search]'));
      const needle = norm(q.trim());
      let shown = 0;
      for (const el of rows) {
        const visible = !needle || norm(el.dataset.search ?? '').includes(needle);
        el.classList.toggle('hidden', !visible);
        if (visible) shown += 1;
      }
      setCounts(needle ? { shown, total: rows.length } : null);
    };

    apply();
    // Si el server re-renderiza la lista (p.ej. tras marcar pagado), las filas
    // nuevas llegan sin filtrar — re-aplicamos. Solo childList: el toggle de
    // clases no dispara este observer (sin bucle).
    const mo = new MutationObserver(apply);
    mo.observe(scope, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [q, scopeId]);

  return (
    <div className={'flex items-center gap-2 ' + (className ?? '')}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="flex-1 h-9 rounded-md border border-line bg-bg-elev px-3 text-sm"
      />
      {counts && (
        <span className="text-xs text-muted whitespace-nowrap tabular-nums">
          {counts.shown}/{counts.total}
        </span>
      )}
    </div>
  );
}
