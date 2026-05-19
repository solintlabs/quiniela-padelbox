import Link from 'next/link';
import { auth } from '@/lib/auth';
import { computeRanking, computeWeeklyRanking } from '@/lib/ranking';
import { prisma } from '@/lib/db';
import { RankingTable } from '@/components/RankingTable';
import { getAllWeeks, getCurrentWeek, getWeekRange } from '@/lib/weeks';

export const metadata = { title: 'Ranking · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  tab?: 'general' | 'semanal';
  week?: string;
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const tab = params.tab === 'semanal' ? 'semanal' : 'general';

  const session = await auth();

  const [rules, weeklyPrizes] = await Promise.all([
    prisma.rules.findUnique({ where: { id: 1 }, select: { tournamentStartAt: true } }),
    prisma.weeklyPrize.findMany({ orderBy: { weekNumber: 'asc' } }),
  ]);

  const tournamentStart = rules?.tournamentStartAt ?? null;
  const allWeeks = tournamentStart ? getAllWeeks(tournamentStart) : [];
  const currentWeek = tournamentStart ? getCurrentWeek(new Date(), tournamentStart) : 1;

  const selectedWeek = (() => {
    if (!tournamentStart) return 1;
    const parsed = Number(params.week);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= allWeeks.length) return parsed;
    return Math.min(currentWeek, allWeeks.length);
  })();

  const ranking =
    tab === 'general'
      ? await computeRanking()
      : (await computeWeeklyRanking(selectedWeek)) ?? [];

  const weekRange = tournamentStart ? getWeekRange(selectedWeek, tournamentStart) : null;
  const weekPrize = weeklyPrizes.find((p) => p.weekNumber === selectedWeek) ?? null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Ranking</h1>
        <p className="text-sm text-muted mt-1">
          Desempate por <span className="text-ink">marcadores exactos</span> · luego por fecha de registro.
        </p>
      </header>

      {/* Tabs General / Semanal */}
      <div className="flex gap-2 border-b border-line">
        <TabLink href="/ranking?tab=general" active={tab === 'general'} label="General" />
        <TabLink
          href={`/ranking?tab=semanal&week=${selectedWeek}`}
          active={tab === 'semanal'}
          label="Semanal"
          disabled={!tournamentStart}
        />
      </div>

      {tab === 'semanal' && tournamentStart && weekRange && (
        <section className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-line bg-bg-elev px-4 py-3">
            <Link
              href={`/ranking?tab=semanal&week=${Math.max(1, selectedWeek - 1)}`}
              aria-disabled={selectedWeek <= 1}
              className={
                'h-9 w-9 inline-flex items-center justify-center rounded-md border border-line ' +
                (selectedWeek <= 1
                  ? 'opacity-40 pointer-events-none'
                  : 'hover:border-accent hover:text-accent')
              }
            >
              ←
            </Link>
            <div className="text-center">
              <p className="font-display text-lg leading-tight">
                Semana {selectedWeek}
                {weekRange.isPartial && <span className="text-muted text-xs ml-2">(parcial)</span>}
              </p>
              <p className="text-xs text-muted mt-0.5">{weekRange.label}</p>
            </div>
            <Link
              href={`/ranking?tab=semanal&week=${Math.min(allWeeks.length, selectedWeek + 1)}`}
              aria-disabled={selectedWeek >= allWeeks.length}
              className={
                'h-9 w-9 inline-flex items-center justify-center rounded-md border border-line ' +
                (selectedWeek >= allWeeks.length
                  ? 'opacity-40 pointer-events-none'
                  : 'hover:border-accent hover:text-accent')
              }
            >
              →
            </Link>
          </div>

          {weekPrize && (
            <div className="rounded-xl border-2 border-[#f14826]/50 bg-[#f14826]/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: '#f14826' }}>
                🍔 Premio de esta semana
              </p>
              <p className="font-display text-sm mt-1 whitespace-pre-line">{weekPrize.prizeText}</p>
              {weekPrize.winnerUserId && (
                <p className="text-xs text-success mt-2">✓ Ganador asignado</p>
              )}
            </div>
          )}

          {tournamentStart && new Date() < weekRange.start && (
            <p className="text-xs text-muted text-center">Esta semana aún no ha empezado.</p>
          )}
        </section>
      )}

      {tab === 'semanal' && !tournamentStart && (
        <p className="text-sm text-muted text-center py-6">
          El ranking semanal estará disponible cuando se configure la fecha de inicio del torneo.
        </p>
      )}

      <RankingTable rows={ranking} meId={session?.user.id} />
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  disabled,
}: {
  href: string;
  active: boolean;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="px-4 py-2 text-sm text-muted/50 cursor-not-allowed">{label}</span>
    );
  }
  return (
    <Link
      href={href}
      className={
        'px-4 py-2 text-sm border-b-2 -mb-px transition-colors ' +
        (active
          ? 'border-accent text-accent font-semibold'
          : 'border-transparent text-muted hover:text-ink')
      }
    >
      {label}
    </Link>
  );
}
