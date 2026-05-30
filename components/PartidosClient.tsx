'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { InlinePredictionRow, type InlineMatch } from './InlinePredictionRow';

interface SectionDef {
  title: string;
  items: InlineMatch[];
  dim?: boolean;
}

interface Props {
  hasPaid: boolean;
  sections: SectionDef[];
}

interface PendingState {
  home: number;
  away: number;
}

/**
 * Cliente: orquesta state local de las predicciones de la lista. Cada fila
 * es controlada. Cambios se acumulan localmente; el user pulsa "Guardar"
 * en cada fila o "Guardar todo (N)" arriba para enviar en batch.
 */
export function PartidosClient({ hasPaid, sections }: Props) {
  const router = useRouter();

  // Estado inicial: lo que ya esta guardado en DB para cada match.
  // Se usa tambien como "baseline" para calcular dirty.
  const initial = useMemo(() => {
    const map = new Map<string, PendingState>();
    for (const sec of sections) {
      for (const m of sec.items) {
        if (m.initial) {
          map.set(m.id, { home: m.initial.homeScore, away: m.initial.awayScore });
        } else {
          map.set(m.id, { home: 0, away: 0 });
        }
      }
    }
    return map;
  }, [sections]);

  // Estado actual (lo que ve y modifica el user).
  const [values, setValues] = useState<Map<string, PendingState>>(() => new Map(initial));
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [bulkSaving, startBulkSave] = useTransition();
  // Secciones (Grupo A, B…) plegadas por el usuario. Set de titles.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCollapsed(title: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function getValue(id: string): PendingState {
    return values.get(id) ?? initial.get(id) ?? { home: 0, away: 0 };
  }

  function isDirty(id: string): boolean {
    const cur = getValue(id);
    const base = initial.get(id);
    // dirty si NO hay initial y el user puso algo, o si difiere del initial
    const hadInitial = sections.some((s) => s.items.find((m) => m.id === id && m.initial));
    if (!hadInitial) {
      return cur.home !== 0 || cur.away !== 0;
    }
    return base ? cur.home !== base.home || cur.away !== base.away : true;
  }

  function onChange(id: string, home: number, away: number) {
    setValues((prev) => {
      const next = new Map(prev);
      next.set(id, { home, away });
      return next;
    });
    setErrors((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  async function saveOne(id: string) {
    const v = getValue(id);
    setSaving((s) => new Set(s).add(id));
    setErrors((e) => {
      const n = new Map(e);
      n.delete(id);
      return n;
    });
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: id, homeScore: v.home, awayScore: v.away }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? body.error ?? 'No se pudo guardar');
      }
      // Marca como guardado: actualiza el "initial" para que dirty=false
      initial.set(id, { home: v.home, away: v.away });
      router.refresh();
    } catch (e) {
      setErrors((errs) => {
        const n = new Map(errs);
        n.set(id, e instanceof Error ? e.message : 'Error');
        return n;
      });
    } finally {
      setSaving((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }

  function saveAll() {
    const dirtyIds = [...values.keys()].filter((id) => isDirty(id));
    if (dirtyIds.length === 0) return;
    const payload = dirtyIds.map((id) => {
      const v = getValue(id);
      return { matchId: id, homeScore: v.home, awayScore: v.away };
    });
    startBulkSave(async () => {
      try {
        const res = await fetch('/api/predictions/batch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ predictions: payload }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? body.error ?? 'No se pudo guardar');
        }
        // Limpia dirty: actualiza initial para todos
        for (const id of dirtyIds) {
          const v = getValue(id);
          initial.set(id, { home: v.home, away: v.away });
        }
        setErrors(new Map());
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error';
        setErrors((errs) => {
          const n = new Map(errs);
          for (const id of dirtyIds) n.set(id, msg);
          return n;
        });
      }
    });
  }

  // Lista de matches dirty con sus team names, para la barra superior.
  const dirtyMatches = useMemo(() => {
    const all: Array<{ id: string; home: string; away: string; section: string }> = [];
    for (const sec of sections) {
      for (const m of sec.items) {
        if (isDirty(m.id)) {
          all.push({ id: m.id, home: m.homeTeam, away: m.awayTeam, section: sec.title });
        }
      }
    }
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, values]);
  const dirtyCount = dirtyMatches.length;

  function scrollToMatch(id: string) {
    const el = document.getElementById(`match-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash de atención
      el.classList.add('ring-2', 'ring-warning', 'ring-offset-2', 'ring-offset-bg');
      setTimeout(() => el.classList.remove('ring-2', 'ring-warning', 'ring-offset-2', 'ring-offset-bg'), 1800);
    }
  }

  return (
    <>
      {/* Barra flotante "Guardar todo" cuando hay cambios */}
      {hasPaid && dirtyCount > 0 && (
        <div className="sticky top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 backdrop-blur bg-bg/90 border-b border-warning/40 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-warning">
              ● <span className="font-semibold tabular-nums">{dirtyCount}</span>{' '}
              pronóstico{dirtyCount !== 1 && 's'} sin guardar
            </p>
            <button
              type="button"
              onClick={saveAll}
              disabled={bulkSaving}
              className="h-10 px-5 rounded-lg bg-accent text-accent-fg font-display text-sm disabled:opacity-60"
            >
              {bulkSaving ? 'Guardando…' : `Guardar todo (${dirtyCount}) →`}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dirtyMatches.slice(0, 8).map((dm) => (
              <button
                key={dm.id}
                type="button"
                onClick={() => scrollToMatch(dm.id)}
                className="text-[11px] px-2 py-1 rounded-md border border-warning/40 bg-warning/10 text-ink hover:bg-warning/20"
                title={`${dm.section} · ir al partido`}
              >
                {dm.home} vs {dm.away} ↗
              </button>
            ))}
            {dirtyMatches.length > 8 && (
              <span className="text-[11px] text-muted self-center">
                + {dirtyMatches.length - 8} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* Botones colapsar/expandir todo - solo si hay grupos (secciones colapsables) */}
      {sections.some((s) => s.items.length > 0) && (
        <div className="flex gap-1.5 -mb-2 no-print">
          <button
            type="button"
            onClick={() => setCollapsed(new Set(sections.map((s) => s.title)))}
            className="text-[11px] px-2.5 py-1 rounded-md border border-line text-muted hover:text-ink hover:bg-bg-elev"
          >
            ⊟ Plegar todos
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(new Set())}
            className="text-[11px] px-2.5 py-1 rounded-md border border-line text-muted hover:text-ink hover:bg-bg-elev"
          >
            ⊞ Desplegar todos
          </button>
        </div>
      )}

      {sections.map((sec) => {
        if (sec.items.length === 0) return null;
        const isCollapsed = collapsed.has(sec.title);
        const filled = sec.items.filter((m) => {
          const v = getValue(m.id);
          // "rellenado" si tiene predicción inicial guardada o si tiene cambios sin 0-0
          const hasInitial = !!m.initial;
          return hasInitial || v.home !== 0 || v.away !== 0;
        }).length;
        const dirtyInSection = sec.items.filter((m) => isDirty(m.id)).length;
        return (
          <section key={sec.title}>
            <button
              type="button"
              onClick={() => toggleCollapsed(sec.title)}
              className="w-full flex items-center justify-between gap-2 mb-3 group"
              aria-expanded={!isCollapsed}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={
                    'text-muted transition-transform inline-block text-xs ' +
                    (isCollapsed ? '' : 'rotate-90')
                  }
                >
                  ▶
                </span>
                <h2 className="text-xs uppercase tracking-[0.18em] text-muted group-hover:text-ink">
                  {sec.title}
                </h2>
              </span>
              <span className="text-[11px] text-muted tabular-nums">
                {filled}/{sec.items.length}
                {dirtyInSection > 0 && (
                  <span className="ml-1.5 text-warning">● {dirtyInSection}</span>
                )}
              </span>
            </button>
            {!isCollapsed && (
              <div className={'space-y-2 ' + (sec.dim ? 'opacity-80' : '')}>
                {sec.items.map((m) => {
                  const v = getValue(m.id);
                  return (
                    <InlinePredictionRow
                      key={m.id}
                      match={m}
                      canEdit={hasPaid}
                      homeValue={v.home}
                      awayValue={v.away}
                      onChange={onChange}
                      dirty={isDirty(m.id)}
                      saving={saving.has(m.id) || bulkSaving}
                      error={errors.get(m.id) ?? null}
                      onSave={saveOne}
                    />
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
