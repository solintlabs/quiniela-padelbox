'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Countdown } from './Countdown';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';
import { cn } from '@/lib/utils';

interface InlineMatch {
  id: string;
  stage: string;
  group: string | null;
  kickoff: string | Date;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string | null;
  awayFlag: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  lockedAt: string | Date | null;
  initial?: { homeScore: number; awayScore: number; points: number | null } | null;
}

interface Props {
  match: InlineMatch;
  canEdit: boolean;
}

function clamp(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(20, Math.floor(n)));
}

/**
 * Card de partido con form inline para predecir.
 * - SCHEDULED + canEdit: steppers + input numérico + autoguardado al perder foco o pulsar +/-.
 * - SCHEDULED sin canEdit (sin hasPaid): muestra disabled con CTA a /inscripcion.
 * - LIVE / FINISHED: solo lectura con badge de resultado/puntos.
 * - El Link al detalle queda como ícono pequeño "→" arriba a la derecha.
 */
export function InlinePredictionRow({ match, canEdit }: Props) {
  const router = useRouter();
  const [home, setHome] = useState<number>(match.initial?.homeScore ?? 0);
  const [away, setAway] = useState<number>(match.initial?.awayScore ?? 0);
  const [hasInitial] = useState<boolean>(!!match.initial);
  const [saved, setSaved] = useState<boolean>(!!match.initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const kickoffDate = new Date(match.kickoff);
  const isLockedByTime = kickoffDate.getTime() - 15 * 60_000 <= Date.now();
  const isLocked = !!match.lockedAt || match.status !== 'SCHEDULED' || isLockedByTime;
  const isFinished = match.status === 'FINISHED';
  const stageLabel =
    match.group === 'LIGA'
      ? 'La Liga'
      : match.stage === 'GROUP' && match.group
        ? `Grupo ${match.group}`
        : STAGE_LABEL[match.stage] ?? match.stage;

  function save(h: number, a: number) {
    if (!canEdit || isLocked) return;
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ matchId: match.id, homeScore: h, awayScore: a }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? body.error ?? 'No se pudo guardar');
        }
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    });
  }

  function setBoth(h: number, a: number) {
    setHome(h);
    setAway(a);
    save(h, a);
  }

  return (
    <article
      className={cn(
        'rounded-xl border p-3 sm:p-4',
        isLocked && !isFinished && 'border-line bg-bg-elev/60',
        !isLocked && hasInitial && 'border-accent/40 bg-accent/5',
        !isLocked && !hasInitial && 'border-line bg-bg-elev',
        isFinished && 'border-line bg-bg-elev',
      )}
    >
      {/* Header: meta + estado clickable a detalle */}
      <Link
        href={`/partidos/${match.id}`}
        className="flex items-center justify-between text-xs text-muted mb-3 hover:text-ink transition-colors"
      >
        <span className="truncate">
          {stageLabel} · {formatDateTime(match.kickoff)}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {isFinished ? (
            <PointsBadge points={match.initial?.points ?? null} />
          ) : isLocked ? (
            <span>Cerrado</span>
          ) : (
            <span className="text-accent">
              <Countdown target={kickoffDate} />
            </span>
          )}
          <span className="text-base leading-none">›</span>
        </div>
      </Link>

      {/* Layout: equipos + score */}
      <div className="flex items-center gap-2">
        {/* Local */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {match.homeFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.homeFlag} alt="" className="w-6 h-6 rounded-sm shrink-0 object-cover" />
          )}
          <span className="font-semibold text-sm truncate">{match.homeTeam}</span>
        </div>

        {/* Score area */}
        {isFinished ? (
          <span className="font-display tabular-nums text-xl min-w-[68px] text-center">
            {match.homeScore}–{match.awayScore}
          </span>
        ) : isLocked ? (
          <span className="font-display tabular-nums text-base text-muted min-w-[68px] text-center">
            – vs –
          </span>
        ) : canEdit ? (
          <div className="flex items-center gap-1 shrink-0">
            <Stepper value={home} onChange={(v) => setBoth(clamp(v), away)} disabled={pending} />
            <span className="text-muted text-xs">–</span>
            <Stepper value={away} onChange={(v) => setBoth(home, clamp(v))} disabled={pending} />
          </div>
        ) : (
          <Link
            href="/inscripcion"
            className="text-[11px] text-warning underline px-2 text-center"
          >
            Inscríbete<br />para predecir
          </Link>
        )}

        {/* Visitante */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className="font-semibold text-sm truncate text-right">{match.awayTeam}</span>
          {match.awayFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.awayFlag} alt="" className="w-6 h-6 rounded-sm shrink-0 object-cover" />
          )}
        </div>
      </div>

      {/* Footer: estado guardado + link a ver pronósticos de todos */}
      <div className="flex items-center justify-between mt-2 text-[11px]">
        {isFinished && match.initial ? (
          <p className="text-muted">
            Tu pronóstico: <span className="text-ink tabular-nums">{match.initial.homeScore}–{match.initial.awayScore}</span>
          </p>
        ) : !isLocked && canEdit ? (
          <span>
            {pending && <span className="text-muted">Guardando…</span>}
            {!pending && saved && <span className="text-success">✓ Guardado</span>}
            {error && <span className="text-danger">{error}</span>}
          </span>
        ) : (
          <span />
        )}
        <Link href={`/partidos/${match.id}`} className="text-muted hover:text-accent transition-colors">
          {isLocked ? 'Ver pronósticos de todos →' : 'Ver detalle →'}
        </Link>
      </div>
    </article>
  );
}

function Stepper({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 0}
        aria-label="Restar"
        className="h-8 w-8 rounded-md border border-line hover:bg-bg-elev disabled:opacity-30 disabled:pointer-events-none text-base leading-none"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={0}
        max={20}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        className={cn(
          'w-10 h-9 rounded-md border bg-bg text-center font-display tabular-nums text-lg',
          'border-accent/40 bg-accent/10',
          'focus:outline-none focus:ring-2 focus:ring-accent',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
        )}
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= 20}
        aria-label="Sumar"
        className="h-8 w-8 rounded-md border border-line hover:bg-bg-elev disabled:opacity-30 disabled:pointer-events-none text-base leading-none"
      >
        +
      </button>
    </div>
  );
}

function PointsBadge({ points }: { points: number | null }) {
  if (points === null) return <span className="text-muted">Calculando…</span>;
  if (points === 3) return <span className="text-success font-semibold">+3 exacto ✓</span>;
  if (points === 1) return <span className="text-warning font-medium">+1 ganador</span>;
  return <span className="text-muted">0 pts</span>;
}
