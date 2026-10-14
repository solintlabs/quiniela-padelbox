import Link from 'next/link';
import {
  loadTenantPlayer,
  loadActiveCompetition,
  loadFixtureVMs,
  loadRanking,
  loadChampionData,
} from '@/lib/saas/playerView';
import { TenantFixtures } from '../TenantFixtures';
import { TenantPodium } from '../TenantPodium';
import { ChampionPicker } from '../ChampionPicker';
import { PendingBanner, NoCompetition } from '../PlayerBits';

export const dynamic = 'force-dynamic';

/** Inicio del jugador: podio, tu campeón y los próximos partidos. */
export default async function InicioPage({ params }: { params: { tenant: string } }) {
  const { tenant, membershipId, isAdmin, hasPaid, canPredict } = await loadTenantPlayer(
    params.tenant,
  );
  const competition = await loadActiveCompetition(tenant.id);
  if (!competition) return <NoCompetition slug={tenant.slug} isAdmin={isAdmin} />;

  const [fixtures, ranking, champ] = await Promise.all([
    loadFixtureVMs(tenant.id, competition, membershipId, 5),
    loadRanking(tenant.id, competition.id),
    loadChampionData(competition, membershipId),
  ]);

  const mine = ranking.find((r) => r.membershipId === membershipId);

  return (
    <div className="space-y-6">
      {!hasPaid && <PendingBanner entryFee={tenant.entryFee} />}

      {ranking.length > 0 && (
        <TenantPodium
          top={ranking.slice(0, 3).map((r) => ({
            membershipId: r.membershipId,
            displayName: r.displayName || 'Jugador',
            points: r.points,
          }))}
          me={
            mine && mine.position > 3
              ? {
                  position: mine.position,
                  points: mine.points,
                  pointsToPodium: Math.max(0, (ranking[2]?.points ?? 0) - mine.points + 1),
                }
              : null
          }
        />
      )}

      {champ.teams.length >= 2 && competition.pointsBonus > 0 && (
        <ChampionPicker
          slug={tenant.slug}
          competitionId={competition.id}
          bonus={competition.pointsBonus}
          teams={champ.teams}
          currentTeamId={champ.myTeamId}
          locked={champ.locked}
          winnerTeamId={competition.championWinnerTeamId}
          canPredict={canPredict}
        />
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Próximos partidos</h2>
          <Link href={`/saas/${tenant.slug}/partidos`} className="text-sm text-accent hover:underline">
            Ver todos →
          </Link>
        </div>
        <TenantFixtures slug={tenant.slug} canPredict={canPredict} fixtures={fixtures} />
      </section>
    </div>
  );
}
