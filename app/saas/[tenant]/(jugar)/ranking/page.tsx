import Link from 'next/link';
import { loadTenantPlayer, loadActiveCompetition, loadRanking } from '@/lib/saas/playerView';
import { NoCompetition } from '../../PlayerBits';

export const dynamic = 'force-dynamic';

/** Clasificación completa de la competición. */
export default async function RankingPage({ params }: { params: { tenant: string } }) {
  const { tenant, membershipId, isAdmin } = await loadTenantPlayer(params.tenant);
  const competition = await loadActiveCompetition(tenant.id);
  if (!competition) return <NoCompetition slug={tenant.slug} isAdmin={isAdmin} />;

  const ranking = await loadRanking(tenant.id, competition.id);

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl">Clasificación</h2>
      {ranking.length === 0 ? (
        <p className="text-sm text-muted rounded-xl border border-line p-5">
          Aún no hay jugadores con puntos. Aparecerán aquí cuando se pronostique y se
          jueguen los partidos.
        </p>
      ) : (
        <ol className="rounded-xl border border-line bg-bg-elev divide-y divide-line overflow-hidden">
          {ranking.map((row) => (
            <li key={row.membershipId}>
              <Link
                href={`/saas/${tenant.slug}/jugador/${row.membershipId}`}
                className={
                  'flex items-center gap-3 px-4 py-2.5 hover:bg-bg transition-colors ' +
                  (row.membershipId === membershipId ? 'bg-accent/5' : '')
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
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
