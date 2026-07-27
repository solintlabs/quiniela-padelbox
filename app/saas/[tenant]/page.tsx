import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireTenantRolePage } from '@/lib/saas/permissions';
import { competitionScope, fixtureScope } from '@/lib/saas/scope';
import { describeRules, rulesOf, lockTimeFor } from '@/lib/saas/scoring';
import { computeCompetitionRanking } from '@/lib/saas/ranking';
import { hasAtLeastRole } from '@/lib/saas/roles';
import { showsBranding, showsAds } from '@/lib/saas/plans';
import { tenantThemeVars } from '@/lib/saas/theme';
import { formatDateTime } from '@/lib/format';
import { TenantFixtures, type FixtureVM } from './TenantFixtures';
import { TenantPodium } from './TenantPodium';
import { ChampionPicker } from './ChampionPicker';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { tenant: string };
}): Promise<Metadata> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.tenant },
    select: { name: true },
  });
  if (!tenant) return { title: 'Quiniela · QuinielaBOX' };
  const title = `${tenant.name} · Quiniela`;
  const description = `Pronostica los partidos y compite en la clasificación de ${tenant.name}. Quiniela creada con QuinielaBOX.`;
  return {
    title,
    description,
    // Las páginas de jugador requieren membresía → no se indexan.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'website' },
  };
}

/**
 * Vista del jugador: próximos partidos y clasificación de su club.
 */
export default async function TenantHomePage({ params }: { params: { tenant: string } }) {
  const ctx = await requireTenantRolePage(params.tenant, 'PLAYER');
  const { tenant, membership } = ctx;

  const sponsors = await prisma.sponsor.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, logoUrl: true, url: true },
  });

  const competition = await prisma.saasCompetition.findFirst({
    where: competitionScope(tenant.id, { status: { in: ['OPEN', 'LOCKED', 'FINISHED'] } }),
    orderBy: { createdAt: 'desc' },
  });

  if (!competition) {
    return (
      <Shell tenant={tenant} sponsors={sponsors}>
        <p className="text-sm text-muted rounded-xl border border-line p-5">
          {hasAtLeastRole(membership.role, 'ADMIN')
            ? 'Todavía no hay ninguna competición en esta quiniela. Ve al panel para crearla.'
            : 'El organizador todavía no ha abierto la quiniela. Vuelve en un rato.'}
        </p>
        {hasAtLeastRole(membership.role, 'ADMIN') && (
          <Link
            href={`/saas/${tenant.slug}/panel`}
            className="inline-flex h-11 px-5 rounded-lg bg-accent text-accent-fg font-display tracking-tight text-sm items-center"
          >
            Ir al panel →
          </Link>
        )}
      </Shell>
    );
  }

  const now = new Date();
  const [fixtures, ranking] = await Promise.all([
    prisma.saasFixture.findMany({
      where: fixtureScope(tenant.id, {
        competitionId: competition.id,
        kickoff: { gte: new Date(now.getTime() - 3 * 86_400_000) },
      }),
      orderBy: { kickoff: 'asc' },
      take: 12,
      include: { homeTeam: true, awayTeam: true },
    }),
    computeCompetitionRanking(tenant.id, competition.id),
  ]);

  const myEntries = await prisma.saasEntry.findMany({
    where: { membershipId: membership.id, fixtureId: { in: fixtures.map((f) => f.id) } },
    select: { fixtureId: true, homeScore: true, awayScore: true, points: true },
  });
  const entryByFixture = new Map(myEntries.map((e) => [e.fixtureId, e]));

  // Datos del pick de campeón: equipos, mi pick, y el primer partido (para saber
  // si ya está cerrado). Solo tiene sentido en torneos (≥ 2 equipos).
  const [champTeams, myPick, firstFixture] = await Promise.all([
    prisma.saasTeam.findMany({
      where: { competitionId: competition.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true },
    }),
    prisma.saasChampionPick.findFirst({
      where: { membershipId: membership.id, competitionId: competition.id },
      select: { teamId: true },
    }),
    prisma.saasFixture.findFirst({
      where: { competitionId: competition.id },
      orderBy: { kickoff: 'asc' },
      select: { kickoff: true },
    }),
  ]);
  const championLocked = !!firstFixture && firstFixture.kickoff.getTime() <= now.getTime();

  // El organizador (ADMIN/OWNER) siempre puede pronosticar; el jugador, cuando
  // el organizador confirma su inscripción.
  const canPredict = membership.hasPaid || hasAtLeastRole(membership.role, 'ADMIN');
  const fixtureVMs: FixtureVM[] = fixtures.map((f) => {
    const closed =
      f.lockedAt !== null ||
      lockTimeFor(f.kickoff, competition.lockOffsetMin).getTime() <= now.getTime();
    const e = entryByFixture.get(f.id);
    return {
      id: f.id,
      home: f.homeTeam.name,
      away: f.awayTeam.name,
      homeLogo: f.homeTeam.logoUrl,
      awayLogo: f.awayTeam.logoUrl,
      kickoff: formatDateTime(f.kickoff),
      round: f.round,
      closed,
      homeScore: f.homeScore,
      awayScore: f.awayScore,
      myHome: e?.homeScore ?? null,
      myAway: e?.awayScore ?? null,
      points: e?.points ?? null,
    };
  });

  return (
    <Shell tenant={tenant} sponsors={sponsors}>
      {!membership.hasPaid && (
        <p className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
          Tu inscripción está pendiente de confirmar por el organizador. Podrás
          pronosticar en cuanto la valide.
        </p>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="font-display text-xl">{competition.name}</h2>
          <ul className="flex flex-wrap gap-1.5">
            {describeRules(rulesOf(competition)).map((line) => (
              <li key={line} className="text-[11px] rounded-full border border-line px-2 py-0.5 text-muted">
                {line}
              </li>
            ))}
          </ul>
        </div>

        <TenantFixtures slug={tenant.slug} canPredict={canPredict} fixtures={fixtureVMs} />
      </section>

      {champTeams.length >= 2 && competition.pointsBonus > 0 && (
        <ChampionPicker
          slug={tenant.slug}
          competitionId={competition.id}
          bonus={competition.pointsBonus}
          teams={champTeams}
          currentTeamId={myPick?.teamId ?? null}
          locked={championLocked}
          winnerTeamId={competition.championWinnerTeamId}
          canPredict={canPredict}
        />
      )}

      {ranking.length > 0 && (
        <TenantPodium
          top={ranking.slice(0, 3).map((r) => ({
            membershipId: r.membershipId,
            displayName: r.displayName || 'Jugador',
            points: r.points,
          }))}
          me={(() => {
            const mine = ranking.find((r) => r.membershipId === membership.id);
            if (!mine || mine.position <= 3) return null;
            const third = ranking[2]?.points ?? 0;
            return {
              position: mine.position,
              points: mine.points,
              pointsToPodium: Math.max(0, third - mine.points + 1),
            };
          })()}
        />
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl">Clasificación completa</h2>
        {ranking.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay jugadores.</p>
        ) : (
          <ol className="rounded-xl border border-line bg-bg-elev divide-y divide-line overflow-hidden">
            {ranking.slice(0, 20).map((row) => (
              <li
                key={row.membershipId}
                className={
                  'flex items-center gap-3 px-4 py-2.5 ' +
                  (row.membershipId === membership.id ? 'bg-accent/5' : '')
                }
              >
                <span className="w-7 text-sm text-muted tabular-nums">{row.position}</span>
                <span className="flex-1 min-w-0 truncate text-sm flex items-center gap-1.5">
                  {row.champion?.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.champion.logoUrl}
                      alt={row.champion.name}
                      title={`Campeón: ${row.champion.name}`}
                      className={
                        'h-4 w-4 object-contain shrink-0 ' +
                        (row.champion.correct ? '' : 'opacity-60')
                      }
                    />
                  )}
                  <span className="truncate">{row.displayName || 'Jugador'}</span>
                </span>
                <span className="text-xs text-muted tabular-nums">{row.exact} exactos</span>
                <span className="font-display tabular-nums w-12 text-right">{row.points}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {hasAtLeastRole(membership.role, 'ADMIN') && (
        <Link
          href={`/saas/${tenant.slug}/panel`}
          className="inline-flex h-10 px-4 rounded-lg border border-line text-sm items-center"
        >
          ← Volver al panel
        </Link>
      )}
    </Shell>
  );
}

function Shell({
  tenant,
  sponsors,
  children,
}: {
  tenant: {
    name: string;
    slug: string;
    accentColor: string;
    plan: 'FREE' | 'PRO' | 'CUSTOM';
    logoUrl: string | null;
    prizesText: string | null;
  };
  sponsors: Array<{ id: string; name: string; logoUrl: string | null; url: string | null }>;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-bg" style={tenantThemeVars(tenant.accentColor)}>
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <header className="flex items-center gap-4">
          {tenant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-14 w-14 rounded-xl object-contain border border-line bg-bg-elev"
            />
          )}
          <div>
            <p
              className="text-xs uppercase tracking-[0.28em] font-bold"
              style={{ color: tenant.accentColor }}
            >
              {tenant.name}
            </p>
            <h1 className="font-display text-3xl mt-1">La quiniela</h1>
          </div>
        </header>

        {children}

        {tenant.prizesText && (
          <section className="rounded-xl border border-line bg-bg-elev p-5">
            <h2 className="font-display text-lg mb-2">Premios</h2>
            <p className="text-sm whitespace-pre-line leading-relaxed">{tenant.prizesText}</p>
          </section>
        )}

        {sponsors.length > 0 && (
          <section className="pt-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted text-center mb-3">
              Patrocinadores
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {sponsors.map((s) => {
                const inner = s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt={s.name} className="h-8 object-contain" />
                ) : (
                  <span className="text-sm text-muted">{s.name}</span>
                );
                return s.url ? (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100">
                    {inner}
                  </a>
                ) : (
                  <span key={s.id}>{inner}</span>
                );
              })}
            </div>
          </section>
        )}

        {showsAds(tenant.plan) && (
          <a
            href="/"
            className="block rounded-xl border border-dashed border-line bg-bg-elev p-3 text-center text-xs text-muted hover:border-accent transition-colors"
          >
            Publicidad ·{' '}
            <span className="text-accent font-semibold">
              Crea tu propia quiniela gratis en QuinielaBOX →
            </span>
          </a>
        )}

        {showsBranding(tenant.plan) && (
          <p className="text-[11px] text-muted text-center pt-6 border-t border-line">
            Powered by QuinielaBOX ·{' '}
            <a href="/" className="hover:text-accent">
              crea la tuya
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
