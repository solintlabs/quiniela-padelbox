import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { PredictionForm } from '@/components/PredictionForm';
import { Countdown } from '@/components/Countdown';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user.id;
  const hasPaid = session!.user.hasPaid;

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      predictions: {
        where: { userId },
        select: { homeScore: true, awayScore: true, points: true },
      },
    },
  });
  if (!match) notFound();

  const mine = match.predictions[0];
  const isLockedByTime = new Date(match.kickoff).getTime() - 15 * 60 * 1000 <= Date.now();
  const isLocked = !!match.lockedAt || match.status !== 'SCHEDULED' || isLockedByTime;
  const isFinished = match.status === 'FINISHED';
  const stageLabel = match.stage === 'GROUP' && match.group
    ? `Grupo ${match.group}`
    : STAGE_LABEL[match.stage] ?? match.stage;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link href="/partidos" className="text-sm text-muted hover:text-ink">← Partidos</Link>

      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {stageLabel} · {formatDateTime(match.kickoff)}
        </p>
        <div className="flex items-center justify-center gap-6 mt-5">
          <div className="flex flex-col items-center gap-2 w-32">
            {match.homeFlag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={match.homeFlag}
                alt=""
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <p className="font-display text-lg leading-tight">{match.homeTeam}</p>
          </div>
          <span className="font-display text-2xl text-muted">vs</span>
          <div className="flex flex-col items-center gap-2 w-32">
            {match.awayFlag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={match.awayFlag}
                alt=""
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <p className="font-display text-lg leading-tight">{match.awayTeam}</p>
          </div>
        </div>
        {!isLocked ? (
          <p className="text-accent text-sm mt-3">
            Cierra en <Countdown target={match.kickoff} format="clock" warnAtMinutes={120} />
          </p>
        ) : isFinished ? (
          <p className="font-display text-5xl tabular-nums mt-4">
            {match.homeScore} – {match.awayScore}
          </p>
        ) : (
          <p className="text-muted text-sm mt-3">Cerrado</p>
        )}
      </header>

      <section className="rounded-xl border border-line bg-bg-elev p-4 sm:p-8">
        {isFinished && mine ? (
          <FinishedSummary mine={mine} home={match.homeScore!} away={match.awayScore!} />
        ) : (
          <PredictionForm
            matchId={match.id}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            initialHome={mine?.homeScore}
            initialAway={mine?.awayScore}
            disabled={isLocked || !hasPaid}
            disabledReason={
              !hasPaid
                ? 'Tu cuenta aún no está activada. Contacta con PADELBOX.'
                : isLocked
                  ? 'Este partido ya no admite cambios.'
                  : undefined
            }
          />
        )}
      </section>
    </div>
  );
}

function FinishedSummary({
  mine,
  home,
  away,
}: {
  mine: { homeScore: number; awayScore: number; points: number | null };
  home: number;
  away: number;
}) {
  const exact = mine.homeScore === home && mine.awayScore === away;
  const winner =
    (mine.homeScore > mine.awayScore && home > away) ||
    (mine.homeScore < mine.awayScore && home < away) ||
    (mine.homeScore === mine.awayScore && home === away);

  return (
    <div className="text-center space-y-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Tu pronóstico</p>
      <p className="font-display text-4xl tabular-nums">
        {mine.homeScore} – {mine.awayScore}
      </p>
      {exact && <p className="text-success font-semibold">¡Marcador exacto! +3 pts</p>}
      {!exact && winner && <p className="text-warning">Acertaste al ganador. +1 pt</p>}
      {!winner && <p className="text-muted">Esta vez no. 0 pts.</p>}
    </div>
  );
}
