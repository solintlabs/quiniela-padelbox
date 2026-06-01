'use client';

import Link from 'next/link';
import { Countdown } from './Countdown';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface InlineMatch {
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
  // Tendencia agregada (% gana local / empate / gana visitante). Sin numero
  // total de predicciones — solo porcentajes. null si hay <3 predicciones.
  distribution?: { homePct: number; drawPct: number; awayPct: number } | null;
}

interface Props {
  match: InlineMatch;
  canEdit: boolean;
  /** Valores actuales (controlled — los maneja PartidosClient). */
  homeValue: number;
  awayValue: number;
  /** Cambio local (no envia al backend). */
  onChange: (matchId: string, home: number, away: number) => void;
  /** true si hay cambios pendientes vs el initial guardado. */
  dirty: boolean;
  saving: boolean;
  error: string | null;
  /** Trigger guardar SOLO este partido. */
  onSave: (matchId: string) => void;
}

function clamp(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(20, Math.floor(n)));
}

/**
 * Card de partido con form inline para predecir.
 * Controlada por PartidosClient: ahora NO autosave - cambios quedan locales
 * hasta que el user pulse "Guardar" en la fila o "Guardar todo" arriba.
 */
export function InlinePredictionRow({
  match,
  canEdit,
  homeValue,
  awayValue,
  onChange,
  dirty,
  saving,
  error,
  onSave,
}: Props) {
  const kickoffDate = new Date(match.kickoff);
  const isLockedByTime = kickoffDate.getTime() - 15 * 60_000 <= Date.now();
  const isLocked = !!match.lockedAt || match.status !== 'SCHEDULED' || isLockedByTime;
  const isFinished = match.status === 'FINISHED';
  const hasInitial = !!match.initial;
  const stageLabel =
    match.group === 'LIGA'
      ? 'La Liga'
      : match.stage === 'GROUP' && match.group
        ? `Grupo ${match.group}`
        : STAGE_LABEL[match.stage] ?? match.stage;

  return (
    <article
      id={`match-${match.id}`}
      className={cn(
        'rounded-xl border p-3 sm:p-4 scroll-mt-32',
        isLocked && !isFinished && 'border-line bg-bg-elev/60',
        !isLocked && dirty && 'border-warning/60 bg-warning/5',
        !isLocked && !dirty && hasInitial && 'border-accent/40 bg-accent/5',
        !isLocked && !dirty && !hasInitial && 'border-line bg-bg-elev',
        isFinished && 'border-line bg-bg-elev',
      )}
    >
      {/* Header */}
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
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {match.homeFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.homeFlag} alt="" className="w-6 h-6 rounded-sm shrink-0 object-cover" />
          )}
          <span className="font-semibold text-sm truncate">{match.homeTeam}</span>
        </div>

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
            <Stepper
              value={homeValue}
              onChange={(v) => onChange(match.id, clamp(v), awayValue)}
              disabled={saving}
            />
            <span className="text-muted text-xs">–</span>
            <Stepper
              value={awayValue}
              onChange={(v) => onChange(match.id, homeValue, clamp(v))}
              disabled={saving}
            />
          </div>
        ) : (
          <Link
            href="/inscripcion"
            className="text-[11px] text-warning underline px-2 text-center"
          >
            Inscríbete<br />para predecir
          </Link>
        )}

        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className="font-semibold text-sm truncate text-right">{match.awayTeam}</span>
          {match.awayFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.awayFlag} alt="" className="w-6 h-6 rounded-sm shrink-0 object-cover" />
          )}
        </div>
      </div>

      {/* Footer: status + accion guardar */}
      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="text-[11px] flex items-center gap-2 min-w-0 flex-1">
          {isFinished && match.initial ? (
            <p className="text-muted truncate">
              Tu pronóstico: <span className="text-ink tabular-nums">{match.initial.homeScore}–{match.initial.awayScore}</span>
            </p>
          ) : !isLocked && canEdit ? (
            <>
              {saving && <span className="text-muted">Guardando…</span>}
              {!saving && dirty && <span className="text-warning">● Sin guardar</span>}
              {!saving && !dirty && hasInitial && <span className="text-success">✓ Guardado</span>}
              {error && <span className="text-danger truncate">{error}</span>}
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isLocked && canEdit && dirty && (
            <button
              type="button"
              onClick={() => onSave(match.id)}
              disabled={saving}
              className="h-8 px-3 rounded-md bg-accent text-accent-fg text-xs font-display disabled:opacity-50"
            >
              {saving ? '…' : 'Guardar'}
            </button>
          )}
          <Link href={`/partidos/${match.id}`} className="text-[11px] text-muted hover:text-accent transition-colors">
            {isLocked ? 'Ver pronósticos →' : 'Detalle →'}
          </Link>
        </div>
      </div>

      {/* Tendencia agregada de predicciones (% local/empate/visitante).
          Solo se muestra si hay datos suficientes (>=3 preds) y el partido
          no ha finalizado. No revela cuanta gente predijo ni marcadores. */}
      {match.distribution && !isFinished && (
        <DistributionBar
          dist={match.distribution}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
        />
      )}
    </article>
  );
}

function DistributionBar({
  dist,
  homeTeam,
  awayTeam,
}: {
  dist: { homePct: number; drawPct: number; awayPct: number };
  homeTeam: string;
  awayTeam: string;
}) {
  const { homePct, drawPct, awayPct } = dist;
  return (
    <div className="mt-3 pt-3 border-t border-line">
      <p className="text-[10px] uppercase tracking-wider text-muted mb-1.5">Cómo predicen</p>
      <div className="flex h-3.5 w-full rounded overflow-hidden bg-bg">
        {homePct > 0 && (
          <div
            className="bg-success/80"
            style={{ width: `${homePct}%` }}
            title={`${homeTeam}: ${homePct}%`}
          />
        )}
        {drawPct > 0 && (
          <div
            className="bg-warning/80"
            style={{ width: `${drawPct}%` }}
            title={`Empate: ${drawPct}%`}
          />
        )}
        {awayPct > 0 && (
          <div
            className="bg-blue-500/80"
            style={{ width: `${awayPct}%` }}
            title={`${awayTeam}: ${awayPct}%`}
          />
        )}
      </div>
      <div className="flex text-[10px] text-muted mt-1 tabular-nums">
        <span className="flex-1 text-left">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-success/80 mr-1 align-middle" />
          {homePct}%
        </span>
        <span className="flex-1 text-center">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning/80 mr-1 align-middle" />
          {drawPct}% empate
        </span>
        <span className="flex-1 text-right">
          {awayPct}%
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500/80 ml-1 align-middle" />
        </span>
      </div>
    </div>
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
