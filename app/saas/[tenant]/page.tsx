import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireTenantRolePage } from '@/lib/saas/permissions';
import { competitionScope, fixtureScope } from '@/lib/saas/scope';
import { describeRules, rulesOf, lockTimeFor } from '@/lib/saas/scoring';
import { computeCompetitionRanking } from '@/lib/saas/ranking';
import { hasAtLeastRole } from '@/lib/saas/roles';
import { showsBranding } from '@/lib/saas/plans';
import { formatDateTime } from '@/lib/format';
import { TenantFixtures, type FixtureVM } from './TenantFixtures';

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Vista del jugador: próximos partidos y clasificación de su club.
 */
export default async function TenantHomePage({ params }: { params: { tenant: string } }) {
  const ctx = await requireTenantRolePage(params.tenant, 'PLAYER');
  const { tenant, membership } = ctx;

  const competition = await prisma.saasCompetition.findFirst({
    where: competitionScope(tenant.id, { status: { in: ['OPEN', 'LOCKED', 'FINISHED'] } }),
    orderBy: { createdAt: 'desc' },
  });

  if (!competition) {
    return (
      <Shell tenant={tenant}>
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
    <Shell tenant={tenant}>
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

      <section className="space-y-3">
        <h2 className="font-display text-xl">Clasificación</h2>
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
                <span className="flex-1 min-w-0 truncate text-sm">{row.displayName || 'Jugador'}</span>
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
  children,
}: {
  tenant: { name: string; slug: string; accentColor: string; plan: 'FREE' | 'PRO' | 'CUSTOM' };
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <header>
          <p
            className="text-xs uppercase tracking-[0.28em] font-bold"
            style={{ color: tenant.accentColor }}
          >
            {tenant.name}
          </p>
          <h1 className="font-display text-3xl mt-1">La quiniela</h1>
        </header>

        {children}

        {showsBranding(tenant.plan) && (
          <p className="text-[11px] text-muted text-center pt-6 border-t border-line">
            Powered by QuinielaBOX
          </p>
        )}
      </div>
    </main>
  );
}
