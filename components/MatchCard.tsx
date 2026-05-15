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
        <span className="flex items-center gap-2 flex-1 min-w-0">
          {match.homeFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={match.homeFlag}
              alt=""
              width={24}
              height={24}
              className="w-6 h-6 shrink-0 rounded-sm object-cover"
            />
          )}
          <span className="font-semibold truncate">{match.homeTeam}</span>
        </span>
        <span className="font-display tabular-nums text-2xl min-w-[5rem] text-center shrink-0">
          {isFinished ? `${match.homeScore} – ${match.awayScore}` : <span className="text-muted">– vs –</span>}
        </span>
        <span className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="font-semibold truncate text-right">{match.awayTeam}</span>
          {match.awayFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={match.awayFlag}
              alt=""
              width={24}
              height={24}
              className="w-6 h-6 shrink-0 rounded-sm object-cover"
            />
          )}
        </span>
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
