import Link from 'next/link';
import { Countdown } from './Countdown';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';
import type { Match, Prediction } from '@prisma/client';

interface MatchCardProps {
  match: Match & { predictions?: Prediction[] };
  myPrediction?: Pick<Prediction, 'homeScore' | 'awayScore' | 'points'> | null;
  /** Si está cerrado por hora aunque DB todavía no lo refleje */
  closed?: boolean;
}

/**
 * Card de partido — variante A compacta horizontal.
 * Una sola fila con info de fecha, equipos, marcador y predicción del usuario.
 */
export function MatchCard({ match, myPrediction, closed }: MatchCardProps) {
  const isFinished = match.status === 'FINISHED';
  const isLocked = closed || !!match.lockedAt || match.status !== 'SCHEDULED';
  const stageLabel = match.stage === 'GROUP' && match.group
    ? `Grupo ${match.group}`
    : STAGE_LABEL[match.stage] ?? match.stage;

  return (
    <Link
      href={`/partidos/${match.id}`}
      className={
        'block rounded-xl border p-4 transition-colors hover:border-accent/40 ' +
        (isLocked && !isFinished ? 'border-line bg-bg-elev/60 ' : 'border-line bg-bg-elev ') +
        (!isLocked ? 'border-accent/30 bg-accent/5' : '')
      }
    >
      <div className="flex items-center justify-between text-xs text-muted mb-2">
        <span>
          {stageLabel} · {formatDateTime(match.kickoff)}
        </span>
        {isFinished ? (
          <PointsBadge points={myPrediction?.points ?? null} />
        ) : isLocked ? (
          <span>Cerrado</span>
        ) : (
          <span className="text-accent">
            Cierra en <Countdown target={match.kickoff} format="compact" />
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold flex-1 truncate">{match.homeTeam}</span>
        <span className="font-display tabular-nums text-2xl min-w-[5rem] text-center">
          {isFinished ? `${match.homeScore} – ${match.awayScore}` : <span className="text-muted">– vs –</span>}
        </span>
        <span className="font-semibold flex-1 truncate text-right">{match.awayTeam}</span>
      </div>

      {myPrediction && (
        <p className="text-xs text-muted mt-2">
          Tu pronóstico:{' '}
          <span className="text-ink tabular-nums">
            {myPrediction.homeScore}–{myPrediction.awayScore}
          </span>
        </p>
      )}
    </Link>
  );
}

function PointsBadge({ points }: { points: number | null }) {
  if (points === null) return <span className="text-muted">Calculando…</span>;
  if (points === 3) return <span className="text-success font-semibold">+3 marcador exacto ✓</span>;
  if (points === 1) return <span className="text-warning font-medium">+1 ganador</span>;
  return <span className="text-muted">0 pts</span>;
}
