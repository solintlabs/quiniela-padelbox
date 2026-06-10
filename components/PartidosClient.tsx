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
  // Mensaje de éxito temporal tras guardar (toast verde arriba).
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // Secciones (Grupo A, B…) plegadas por el usuario. Set de titles.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Matches que el usuario ha tocado (para permitir guardar 0-0 explicito).
  const [touched, setTouched] = useState<Set<string>>(new Set());
  // Matches sin predicción previa que se acaban de guardar en este cliente
  // (antes del refresh del server). Permite que su isDirty compare contra
  // el valor guardado en vez de quedarse "dirty" eternamente.
  const [savedNew, setSavedNew] = useState<Set<string>>(new Set());

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

  function hasSavedPrediction(id: string): boolean {
    return sections.some((s) => s.items.find((m) => m.id === id && m.initial));
  }

  function isDirty(id: string): boolean {
    const cur = getValue(id);
    // Si ya hay una predicción guardada: dirty cuando el valor actual difiere.
    if (hasSavedPrediction(id) && !savedNew.has(id)) {
      const base = initial.get(id);
      return base ? cur.home !== base.home || cur.away !== base.away : true;
    }
    // Si se acaba de guardar una predicción nueva en este cliente, comparamos
    // contra el valor guardado en initial (que ya se actualizó al guardar).
    if (savedNew.has(id)) {
      const base = initial.get(id);
      return base ? cur.home !== base.home || cur.away !== base.away : false;
    }
    // Sin predicción guardada: dirty SOLO si el usuario tocó la fila. Asi se
    // permite guardar un 0-0 explicito (antes 0-0 se confundia con "sin tocar").
    return touched.has(id);
  }

  function onChange(id: string, home: number, away: number) {
    setValues((prev) => {
      const next = new Map(prev);
      next.set(id, { home, away });
      return next;
    });
    setTouched((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setErrors((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  function flashSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2800);
  }

  /** fetch con timeout para que no se quede "guardando" para siempre. */
  async function postJson(url: string, body: unknown, timeoutMs = 25000): Promise<Response> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new Error('Tardó demasiado. Revisa tu conexión e inténtalo de nuevo.');
      }
      throw new Error('Sin conexión. Inténtalo de nuevo.');
    } finally {
      clearTimeout(t);
    }
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
      const res = await postJson('/api/predictions', { matchId: id, homeScore: v.home, awayScore: v.away });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? body.error ?? 'No se pudo guardar');
      }
      // Marca como guardado: actualiza el "initial" para que dirty=false
      initial.set(id, { home: v.home, away: v.away });
      if (!hasSavedPrediction(id)) {
        setSavedNew((s) => new Set(s).add(id));
      }
      setTouched((t) => {
        const n = new Set(t);
        n.delete(id);
        return n;
      });
      flashSuccess('✓ Pronóstico guardado');
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
        const res = await postJson('/api/predictions/batch', { predictions: payload }, 40000);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? body.error ?? 'No se pudo guardar');
        }
        const data = (await res.json().catch(() => ({}))) as { saved?: number; skipped?: unknown[] };
        // Limpia dirty: actualiza initial para todos
        const newlySaved = new Set<string>();
        for (const id of dirtyIds) {
          const v = getValue(id);
          initial.set(id, { home: v.home, away: v.away });
          if (!hasSavedPrediction(id)) newlySaved.add(id);
        }
        setSavedNew((s) => {
          const n = new Set(s);
          newlySaved.forEach((id) => n.add(id));
          return n;
        });
        setTouched((t) => {
          const n = new Set(t);
          dirtyIds.forEach((id) => n.delete(id));
          return n;
        });
        setErrors(new Map());
        const n = data.saved ?? dirtyIds.length;
        flashSuccess(`✓ ${n} pronóstico${n !== 1 ? 's' : ''} guardado${n !== 1 ? 's' : ''}`);
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
  }, [sections, values, touched, savedNew]);
  const dirtyCount = dirtyMatches.length;

  // ¿Tiene predicción guardada? (del server o guardada en este cliente)
  function isSaved(m: InlineMatch): boolean {
    return !!m.initial || savedNew.has(m.id);
  }
  // ¿Se puede aún predecir? (no cerrado por hora / estado)
  function isEditable(m: InlineMatch): boolean {
    if (m.status !== 'SCHEDULED') return false;
    if (m.lockedAt) return false;
    return new Date(m.kickoff).getTime() - 15 * 60_000 > Date.now();
  }

  // Partidos que aún puedes predecir pero NO has guardado (te faltan por llenar).
  const pendingMatches = useMemo(() => {
    const all: Array<{ id: string; home: string; away: string; section: string }> = [];
    for (const sec of sections) {
      for (const m of sec.items) {
        if (isEditable(m) && !isSaved(m)) {
          all.push({ id: m.id, home: m.homeTeam, away: m.awayTeam, section: sec.title });
        }
      }
    }
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, savedNew]);

  // Total editable y guardados (para el "X/Y" global).
  const editableTotal = useMemo(
    () => sections.reduce((acc, sec) => acc + sec.items.filter(isEditable).length, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections],
  );
  const savedTotal = editableTotal - pendingMatches.length;

  function scrollToMatch(id: string) {
    const el = document.getElementById(`match-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash de atención
      el.classList.add('ring-2', 'ring-warning', 'ring-offset-2', 'ring-offset-bg');
      setTimeout(() => el.classList.remove('ring-2', 'ring-warning', 'ring-offset-2', 'ring-offset-bg'), 1800);
    }
  }

  /** Guarda TODOS los partidos pendientes con su valor actual (normalmente 0-0). */
  function saveAllPending() {
    const ids = pendingMatches.map((p) => p.id);
    if (ids.length === 0) return;
    const payload = ids.map((id) => {
      const v = getValue(id);
      return { matchId: id, homeScore: v.home, awayScore: v.away };
    });
    startBulkSave(async () => {
      try {
        const res = await postJson('/api/predictions/batch', { predictions: payload }, 40000);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? body.error ?? 'No se pudo guardar');
        }
        const data = (await res.json().catch(() => ({}))) as { saved?: number };
        for (const id of ids) {
          const v = getValue(id);
          initial.set(id, { home: v.home, away: v.away });
        }
        setSavedNew((s) => {
          const n = new Set(s);
          ids.forEach((id) => n.add(id));
          return n;
        });
        const n = data.saved ?? ids.length;
        flashSuccess(`✓ ${n} partido${n !== 1 ? 's' : ''} guardado${n !== 1 ? 's' : ''} (0-0)`);
        router.refresh();
      } catch (e) {
        flashSuccess(`✗ ${e instanceof Error ? e.message : 'Error al guardar'}`);
      }
    });
  }

  return (
    <>
      {/* Toast de éxito tras guardar */}
      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-success text-white text-sm font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          {successMsg}
        </div>
      )}

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

      {/* Faltan por pronosticar: muestra cuántos y cuáles (solo si no hay cambios sin guardar pendientes) */}
      {hasPaid && pendingMatches.length > 0 && dirtyCount === 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm">
              <span className="text-warning font-semibold">⚠ Te faltan {pendingMatches.length} partido{pendingMatches.length !== 1 && 's'} por pronosticar</span>{' '}
              <span className="text-muted tabular-nums">({savedTotal}/{editableTotal} guardados)</span>
            </p>
            <button
              type="button"
              onClick={saveAllPending}
              disabled={bulkSaving}
              className="h-8 px-3 rounded-md bg-warning text-ink text-xs font-semibold disabled:opacity-60 shrink-0"
            >
              {bulkSaving ? 'Guardando…' : `Guardar los ${pendingMatches.length} como están (0-0)`}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pendingMatches.slice(0, 12).map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => scrollToMatch(pm.id)}
                className="text-[11px] px-2 py-1 rounded-md border border-warning/40 bg-warning/10 text-ink hover:bg-warning/20"
                title={`${pm.section} · ir a pronosticar`}
              >
                {pm.home} vs {pm.away} ↗
              </button>
            ))}
            {pendingMatches.length > 12 && (
              <span className="text-[11px] text-muted self-center">+ {pendingMatches.length - 12} más</span>
            )}
          </div>
        </div>
      )}

      {/* Todo pronosticado */}
      {hasPaid && editableTotal > 0 && pendingMatches.length === 0 && dirtyCount === 0 && (
        <div className="rounded-xl border border-success/40 bg-success/5 p-3 text-sm text-success">
          ✓ ¡Has pronosticado todos los partidos abiertos! ({savedTotal}/{editableTotal})
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
              className="w-full flex flex-row items-center justify-between gap-3 mb-3 py-1.5 text-left group"
              aria-expanded={isCollapsed ? false : true}
            >
              <div className="flex flex-row items-center gap-2 min-w-0">
                <span
                  aria-hidden
                  className="inline-block w-3 text-muted text-sm leading-none shrink-0 select-none"
                >
                  {isCollapsed ? '›' : '⌄'}
                </span>
                <span className="text-xs font-semibold text-muted group-hover:text-ink whitespace-nowrap">
                  {sec.title.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-muted tabular-nums shrink-0 whitespace-nowrap">
                {filled}/{sec.items.length}
                {dirtyInSection > 0 && (
                  <span className="ml-1.5 text-warning">● {dirtyInSection}</span>
                )}
              </div>
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
                      savedLocally={savedNew.has(m.id)}
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
