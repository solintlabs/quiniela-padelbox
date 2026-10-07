import { describeRules, rulesOf } from '@/lib/saas/scoring';
import { loadTenantPlayer, loadActiveCompetition, loadFixtureVMs } from '@/lib/saas/playerView';
import { TenantFixtures } from '../../TenantFixtures';
import { PendingBanner, NoCompetition } from '../../PlayerBits';

export const dynamic = 'force-dynamic';

/** Todos los partidos de la competición, con los pronósticos del jugador. */
export default async function PartidosPage({ params }: { params: { tenant: string } }) {
  const { tenant, membershipId, isAdmin, hasPaid, canPredict } = await loadTenantPlayer(
    params.tenant,
  );
  const competition = await loadActiveCompetition(tenant.id);
  if (!competition) return <NoCompetition slug={tenant.slug} isAdmin={isAdmin} />;

  const fixtures = await loadFixtureVMs(tenant.id, competition, membershipId, 60);

  return (
    <div className="space-y-4">
      {!hasPaid && <PendingBanner entryFee={tenant.entryFee} />}

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

      <TenantFixtures slug={tenant.slug} canPredict={canPredict} fixtures={fixtures} />
    </div>
  );
}
