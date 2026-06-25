import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { PredictionForm } from '@/components/PredictionForm';
import { Countdown } from '@/components/Countdown';
import { MatchPredictionsList, type PredItem } from '@/components/MatchPredictionsList';
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

      <AllPredictions
        matchId={match.id}
        myUserId={userId}
        isLocked={isLocked}
        kickoff={match.kickoff}
        isKnockout={match.stage !== 'GROUP'}
      />

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

async function AllPredictions({
  matchId,
  myUserId,
  isLocked,
  kickoff,
  isKnockout,
}: {
  matchId: string;
  myUserId: string;
  isLocked: boolean;
  kickoff: Date;
  isKnockout: boolean;
}) {
  // En eliminatorias NO se muestra el % de cómo predicen los demás. Antes del
  // cierre simplemente no se muestra nada agregado.
  if (!isLocked && isKnockout) {
    const lockTime = new Date(kickoff.getTime() - 15 * 60_000);
    return (
      <section>
        <div className="rounded-xl border border-line bg-bg-elev p-4 sm:p-5 text-center space-y-1">
          <p className="text-xs">
            🔒 Los pronósticos de los demás se desbloquean{' '}
            <strong>15 min antes del kickoff</strong>
          </p>
          <p className="text-[11px] text-muted">
            Disponible a partir del <span className="text-ink">{formatDateTime(lockTime)}</span>
          </p>
        </div>
      </section>
    );
  }

  // Si aún no está cerrado, mostramos solo DISTRIBUCION agregada
  // (cuántos votan home/empate/away) — no exponemos predicciones individuales.
  if (!isLocked) {
    const allPreds = await prisma.prediction.findMany({
      where: { matchId },
      select: { homeScore: true, awayScore: true },
    });
    const count = allPreds.length;
    const lockTime = new Date(kickoff.getTime() - 15 * 60_000);

    const homeWins = allPreds.filter((p) => p.homeScore > p.awayScore).length;
    const draws = allPreds.filter((p) => p.homeScore === p.awayScore).length;
    const awayWins = allPreds.filter((p) => p.homeScore < p.awayScore).length;
    const pct = (n: number) => (count === 0 ? 0 : Math.round((n / count) * 100));

    // Obtener nombres de equipos para la distribución
    const matchInfo = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeam: true, awayTeam: true },
    });

    return (
      <section>
        <h2 className="font-display text-xl mb-3">Cómo predicen los demás</h2>
        <div className="rounded-xl border border-line bg-bg-elev p-4 sm:p-5 space-y-4">
          {count === 0 ? (
            <p className="text-sm text-muted text-center py-2">
              Aún no hay pronósticos para este partido.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted text-center">
                <strong className="text-ink tabular-nums">{count}</strong>{' '}
                {count === 1 ? 'predicción' : 'predicciones'} ·{' '}
                <span className="text-accent">tendencias agregadas</span>
              </p>

              {/* Barra apilada home / empate / away */}
              <div className="space-y-1.5">
                <div className="flex h-8 sm:h-10 w-full rounded-md overflow-hidden bg-bg-elev">
                  {homeWins > 0 && (
                    <div
                      className="bg-success/80 flex items-center justify-center text-xs sm:text-sm font-semibold text-white"
                      style={{ width: `${pct(homeWins)}%`, minWidth: pct(homeWins) > 0 ? '32px' : '0' }}
                    >
                      {pct(homeWins)}%
                    </div>
                  )}
                  {draws > 0 && (
                    <div
                      className="bg-warning/80 flex items-center justify-center text-xs sm:text-sm font-semibold text-white"
                      style={{ width: `${pct(draws)}%`, minWidth: pct(draws) > 0 ? '32px' : '0' }}
                    >
                      {pct(draws)}%
                    </div>
                  )}
                  {awayWins > 0 && (
                    <div
                      className="bg-info/80 bg-blue-500/80 flex items-center justify-center text-xs sm:text-sm font-semibold text-white"
                      style={{ width: `${pct(awayWins)}%`, minWidth: pct(awayWins) > 0 ? '32px' : '0' }}
                    >
                      {pct(awayWins)}%
                    </div>
                  )}
                </div>
                <div className="flex text-[10px] sm:text-xs text-muted">
                  <div className="flex-1 text-left">
                    <span className="inline-block w-2 h-2 rounded-full bg-success/80 mr-1 align-middle" />
                    Gana {matchInfo?.homeTeam ?? 'local'}
                  </div>
                  <div className="flex-1 text-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-warning/80 mr-1 align-middle" />
                    Empate
                  </div>
                  <div className="flex-1 text-right">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500/80 mr-1 align-middle" />
                    Gana {matchInfo?.awayTeam ?? 'visitante'}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="pt-2 border-t border-line text-center space-y-1">
            <p className="text-xs">
              🔒 Los pronósticos individuales se desbloquean{' '}
              <strong>15 min antes del kickoff</strong>
            </p>
            <p className="text-[11px] text-muted">
              Disponible a partir del{' '}
              <span className="text-ink">{formatDateTime(lockTime)}</span>
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Ya está cerrado: lista completa + agregados
  const [predictions, matchInfo, myPrediction] = await Promise.all([
    prisma.prediction.findMany({
      where: { matchId },
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        points: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ points: 'desc' }, { createdAt: 'asc' }],
    }),
    prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeam: true, awayTeam: true },
    }),
    prisma.prediction.findUnique({
      where: { userId_matchId: { userId: myUserId, matchId } },
      select: { homeScore: true, awayScore: true },
    }),
  ]);

  if (predictions.length === 0) {
    return (
      <section>
        <h2 className="font-display text-xl mb-3">Pronósticos de los demás</h2>
        <div className="rounded-xl border border-line bg-bg-elev p-5">
          <p className="text-sm text-muted text-center">Nadie hizo pronóstico para este partido.</p>
        </div>
      </section>
    );
  }

  // Agregados: comparativa
  let homeWins = 0, draws = 0, awayWins = 0;
  const scoreCount = new Map<string, number>();
  for (const p of predictions) {
    if (p.homeScore > p.awayScore) homeWins++;
    else if (p.homeScore < p.awayScore) awayWins++;
    else draws++;
    const key = `${p.homeScore}-${p.awayScore}`;
    scoreCount.set(key, (scoreCount.get(key) ?? 0) + 1);
  }
  const total = predictions.length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const topScores = [...scoreCount.entries()]
    .map(([k, count]) => {
      const [h, a] = k.split('-').map(Number);
      return { home: h, away: a, count, pct: pct(count) };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Resultado que predijo el mayor número
  const myOutcome = myPrediction
    ? myPrediction.homeScore > myPrediction.awayScore ? 'home'
      : myPrediction.homeScore < myPrediction.awayScore ? 'away' : 'draw'
    : null;
  const majorityOutcome = homeWins > awayWins && homeWins > draws ? 'home'
    : awayWins > draws ? 'away' : 'draw';
  const inMajority = myOutcome && myOutcome === majorityOutcome;

  const homeName = matchInfo?.homeTeam ?? 'Local';
  const awayName = matchInfo?.awayTeam ?? 'Visitante';

  return (
    <section className="space-y-4">
      {/* Comparativa de % — solo en grupos. En eliminatorias no se muestra. */}
      {!isKnockout && (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-accent font-bold mb-3">
          Comparativa · qué predijeron los demás
        </p>

        {/* Barra 1X2 segmentada */}
        <div className="flex h-10 rounded-md overflow-hidden text-[11px] font-display text-ink">
          {homeWins > 0 && (
            <div className="bg-blue-500/70 flex items-center justify-center" style={{ width: `${pct(homeWins)}%`, minWidth: 28 }} title={`${homeWins} predijeron ${homeName} gana`}>
              {pct(homeWins)}%
            </div>
          )}
          {draws > 0 && (
            <div className="bg-zinc-600/70 flex items-center justify-center" style={{ width: `${pct(draws)}%`, minWidth: 28 }} title={`${draws} predijeron empate`}>
              {pct(draws)}%
            </div>
          )}
          {awayWins > 0 && (
            <div className="bg-orange-500/70 flex items-center justify-center" style={{ width: `${pct(awayWins)}%`, minWidth: 28 }} title={`${awayWins} predijeron ${awayName} gana`}>
              {pct(awayWins)}%
            </div>
          )}
        </div>
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span className="text-blue-400">🏠 {homeName}</span>
          <span>Empate</span>
          <span className="text-orange-400">{awayName} 🏃</span>
        </div>

        {/* Tu posición respecto a la mayoría */}
        {myPrediction && (
          <p className="text-xs text-muted mt-4">
            Tu pronóstico: <span className="text-ink font-display tabular-nums">{myPrediction.homeScore}–{myPrediction.awayScore}</span>{' '}
            {inMajority
              ? <span className="text-accent">· estás con la mayoría</span>
              : <span className="text-warning">· vas a contracorriente 👀</span>}
          </p>
        )}

        {/* Top 3 marcadores más predichos */}
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted mb-2">Marcadores más populares</p>
          <div className="flex gap-2 flex-wrap">
            {topScores.map((s, i) => {
              const isMy = myPrediction && s.home === myPrediction.homeScore && s.away === myPrediction.awayScore;
              return (
                <span
                  key={`${s.home}-${s.away}`}
                  className={
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display tabular-nums ' +
                    (isMy ? 'bg-accent/20 border border-accent/60 text-ink' : 'bg-bg border border-line text-muted')
                  }
                >
                  <span>{i === 0 && '🥇 '}{s.home}–{s.away}</span>
                  <span className="text-[10px]">({s.count} · {s.pct}%)</span>
                  {isMy && <span className="text-[10px] text-accent">tú</span>}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      )}

      <MatchPredictionsList
        items={predictions.map<PredItem>((p) => ({
          id: p.id,
          homeScore: p.homeScore,
          awayScore: p.awayScore,
          points: p.points,
          label: p.user.name ?? p.user.email,
          isMe: p.user.id === myUserId,
        }))}
      />
    </section>
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
