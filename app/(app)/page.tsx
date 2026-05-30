import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { computeRanking } from '@/lib/ranking';
import { PodioHero } from '@/components/PodioHero';
import { Countdown } from '@/components/Countdown';
import { AliadosStrip } from '@/components/AliadosStrip';
import { AppStoreBadges } from '@/components/AppStoreBadges';
import { formatDateTime } from '@/lib/format';
import { getCurrentWeek, getWeekRange } from '@/lib/weeks';

export const metadata = { title: 'Inicio · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [ranking, nextMatch, groupStats, me_user, rules] = await Promise.all([
    computeRanking(),
    prisma.match.findFirst({
      where: { status: 'SCHEDULED', lockedAt: null },
      orderBy: { kickoff: 'asc' },
      include: {
        predictions: {
          where: { userId },
          select: { homeScore: true, awayScore: true },
        },
      },
    }),
    (async () => {
      const offsetMs = 15 * 60_000;
      const now = new Date(Date.now() + offsetMs);
      const total = await prisma.match.count({
        where: { stage: 'GROUP', kickoff: { gt: now }, group: { in: ['A','B','C','D','E','F','G','H','I','J','K','L'] } },
      });
      const filled = await prisma.prediction.count({
        where: { userId, match: { stage: 'GROUP', kickoff: { gt: now }, group: { in: ['A','B','C','D','E','F','G','H','I','J','K','L'] } } },
      });
      return { total, filled };
    })(),
    prisma.user.findUnique({ where: { id: userId }, select: { hasPaid: true } }),
    prisma.rules.findUnique({ where: { id: 1 }, select: { weeklyPrizesText: true, tournamentStartAt: true } }),
  ]);

  // Premio de la semana actual desde WeeklyPrize; fallback a Rules.weeklyPrizesText
  const currentWeek = rules?.tournamentStartAt
    ? getCurrentWeek(new Date(), rules.tournamentStartAt)
    : null;
  const currentWeekRange = rules?.tournamentStartAt && currentWeek
    ? getWeekRange(currentWeek, rules.tournamentStartAt)
    : null;
  const currentWeekPrize = currentWeek
    ? await prisma.weeklyPrize.findUnique({ where: { weekNumber: currentWeek } })
    : null;
  const weeklyPrizeText = currentWeekPrize?.prizeText ?? rules?.weeklyPrizesText ?? null;

  const myPrediction = nextMatch?.predictions?.[0];

  const top3 = ranking.slice(0, 3);
  const position = ranking.findIndex((r) => r.userId === userId);
  const me =
    position >= 0
      ? {
          position: position + 1,
          row: ranking[position],
          pointsToPodium: Math.max(0, (ranking[2]?.points ?? 0) - ranking[position].points + 1),
        }
      : null;

  return (
    <div className="space-y-6 sm:space-y-12">
      <PodioHero top={top3} me={me} />

      {rules?.tournamentStartAt && rules.tournamentStartAt.getTime() > Date.now() && (
        <p className="text-center text-[11px] sm:text-xs text-muted -mt-3">
          🌍 Mundial 2026 empieza en{' '}
          <span className="text-accent font-semibold">
            <Countdown target={rules.tournamentStartAt} />
          </span>
        </p>
      )}

      {groupStats.total > 0 && groupStats.filled < groupStats.total && (
        <section className="rounded-xl border border-accent/30 bg-accent/5 p-3 sm:p-5 max-w-2xl mx-auto">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="text-xl sm:text-2xl">🎯</span>
            <div className="flex-1">
              <p className="font-display text-sm sm:text-lg leading-tight">Rellena tu quiniela</p>
              <p className="text-xs sm:text-sm text-muted mt-1">
                Llevas <span className="text-accent font-semibold tabular-nums">{groupStats.filled}</span>{' '}
                de <span className="tabular-nums">{groupStats.total}</span> partidos de fase de grupos.
              </p>
              <div className="mt-2 sm:mt-3 h-1 sm:h-1.5 rounded-full bg-bg overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${(groupStats.filled / Math.max(groupStats.total, 1)) * 100}%` }}
                />
              </div>
              <Link
                href="/partidos?tab=mundial"
                className="inline-flex items-center mt-3 sm:mt-4 h-9 sm:h-10 px-4 sm:px-5 rounded-lg bg-accent text-accent-fg font-display text-xs sm:text-sm hover:brightness-95"
              >
                {groupStats.filled === 0 ? 'EMPEZAR →' : 'CONTINUAR →'}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Descarga la app móvil — al inicio del dashboard para máxima visibilidad
          tras login. Se muestra a todos los usuarios autenticados. */}
      <div className="max-w-2xl mx-auto">
        <AppStoreBadges variant="hero" />
      </div>

      {nextMatch ? (
        <section className="rounded-xl border border-accent/30 bg-accent/5 p-4 sm:p-6 shadow-glow-accent max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted mb-3 sm:mb-5">
            <span className="uppercase tracking-[0.18em]">Siguiente partido</span>
            <span className="text-accent">
              Cierra en <Countdown target={nextMatch.kickoff} />
            </span>
          </div>
          <div className="flex items-center justify-around gap-2 sm:gap-3">
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              {nextMatch.homeFlag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nextMatch.homeFlag}
                  alt=""
                  width={48}
                  height={48}
                  className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover"
                />
              )}
              <p className="font-display text-sm sm:text-lg leading-tight text-center truncate w-full">
                {nextMatch.homeTeam}
              </p>
            </div>
            <span className="font-display text-base sm:text-xl text-muted">vs</span>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              {nextMatch.awayFlag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nextMatch.awayFlag}
                  alt=""
                  width={48}
                  height={48}
                  className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover"
                />
              )}
              <p className="font-display text-sm sm:text-lg leading-tight text-center truncate w-full">
                {nextMatch.awayTeam}
              </p>
            </div>
          </div>
          <p className="text-center text-[10px] sm:text-xs text-muted mt-3 sm:mt-4">
            {formatDateTime(nextMatch.kickoff)}
          </p>
          {myPrediction && (
            <p className="text-center text-xs sm:text-sm mt-2 sm:mt-3">
              <span className="text-muted">Tu pronóstico:</span>{' '}
              <span className="font-display tabular-nums text-base sm:text-lg text-accent">
                {myPrediction.homeScore}–{myPrediction.awayScore}
              </span>
            </p>
          )}
          <div className="mt-3 sm:mt-5 text-center">
            <Link
              href={`/partidos/${nextMatch.id}`}
              className="inline-flex items-center justify-center h-10 sm:h-12 px-5 sm:px-8 rounded-lg bg-accent text-accent-fg font-display tracking-tight text-sm sm:text-base hover:brightness-95"
            >
              {myPrediction ? 'EDITAR PRONÓSTICO →' : 'PREDECIR →'}
            </Link>
          </div>
        </section>
      ) : (
        <section className="text-center text-muted text-xs sm:text-sm">
          No hay partidos pendientes. Ve a <Link href="/partidos" className="underline">/partidos</Link>.
        </section>
      )}

      {/* Premio de esta semana — el admin lo edita en /admin/pagos por semana */}
      {weeklyPrizeText && (
        <section className="max-w-2xl mx-auto rounded-2xl border-2 border-[#f14826]/50 bg-[#f14826]/10 p-3 sm:p-5">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="text-[10px] uppercase tracking-[0.22em] sm:tracking-[0.28em] font-bold" style={{ color: '#f14826' }}>
              🍔 Premio de esta semana
            </p>
            {currentWeek && currentWeekRange && (
              <Link
                href={`/ranking?tab=semanal&week=${currentWeek}`}
                className="text-[10px] uppercase tracking-[0.15em] text-muted hover:text-accent"
              >
                Sem {currentWeek} →
              </Link>
            )}
          </div>
          <p className="font-display text-xs sm:text-sm text-ink mt-2 whitespace-pre-line leading-relaxed">
            {weeklyPrizeText}
          </p>
        </section>
      )}

      {/* Cross-sell: "quiero mi quiniela" — link discreto */}
      <p className="text-center text-[11px] text-muted">
        ¿Conoces un club que quiera su quiniela?{' '}
        <Link href="/lanza-tu-quiniela" className="text-accent hover:underline">
          Recomiéndanos →
        </Link>
      </p>

      {/* Premios garantizados (fijos, independiente de inscritos) */}
      <section className="max-w-2xl mx-auto">
        <header className="text-center mb-3 sm:mb-4">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-accent">Premios garantizados</p>
          <h2 className="font-display text-xl sm:text-3xl mt-1">🏆 El bote del Mundial</h2>
          <p className="text-[11px] text-muted mt-2 sm:mt-3 max-w-md mx-auto">
            + gift cards y productos <span className="text-[#f14826] font-semibold">DELISH</span> cada semana
          </p>
        </header>
        <div className="rounded-xl border border-line bg-bg-elev overflow-hidden mt-3 sm:mt-6">
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-4">
            <span className="text-sm sm:text-base">🥇 1er lugar</span>
            <span className="font-display text-lg sm:text-2xl tabular-nums text-accent">$1.500</span>
          </div>
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-4 border-t border-line">
            <span className="text-sm sm:text-base">🥈 2º lugar</span>
            <span className="font-display text-lg sm:text-2xl tabular-nums">$600</span>
          </div>
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-4 border-t border-line">
            <span className="text-sm sm:text-base">🥉 3er lugar</span>
            <span className="font-display text-lg sm:text-2xl tabular-nums">$300</span>
          </div>
        </div>
        {!me_user?.hasPaid && (
          <p className="text-xs text-warning mt-4 text-center">
            <Link href="/inscripcion" className="underline">Inscríbete</Link> para competir por estos premios
          </p>
        )}
      </section>

      {/* Aliados comerciales — al final del dashboard, cerrando con marca */}
      <div className="max-w-2xl mx-auto">
        <AliadosStrip variant="dashboard" />
      </div>
    </div>
  );
}

