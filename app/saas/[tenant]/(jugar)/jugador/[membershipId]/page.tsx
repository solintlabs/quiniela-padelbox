import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { loadTenantPlayer, loadActiveCompetition } from '@/lib/saas/playerView';
import { lockTimeFor } from '@/lib/saas/scoring';
import { publicDisplayName } from '@/lib/display';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * Perfil público de un jugador de la quiniela: sus estadísticas y sus
 * pronósticos de partidos YA CERRADOS (los abiertos se ocultan para que nadie
 * copie). Se llega desde el ranking.
 */
export default async function JugadorPage({
  params,
}: {
  params: { tenant: string; membershipId: string };
}) {
  const { tenant, membershipId: myId } = await loadTenantPlayer(params.tenant);

  const target = await prisma.saasMembership.findFirst({
    where: { id: params.membershipId, tenantId: tenant.id },
    select: { id: true, userId: true, displayName: true, createdAt: true, hasPaid: true },
  });
  if (!target) notFound();

  const [user, competition] = await Promise.all([
    prisma.user.findUnique({
      where: { id: target.userId },
      select: { name: true, email: true },
    }),
    loadActiveCompetition(tenant.id),
  ]);

  const name =
    target.displayName ||
    (user ? publicDisplayName({ name: user.name, email: user.email }) : 'Jugador');
  const isMe = target.id === myId;

  const entries = competition
    ? await prisma.saasEntry.findMany({
        where: { membershipId: target.id, fixture: { competitionId: competition.id } },
        include: {
          fixture: {
            include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
          },
        },
        orderBy: { fixture: { kickoff: 'desc' } },
      })
    : [];

  const now = new Date();
  const lockOffset = competition?.lockOffsetMin ?? 0;
  const visible = entries.filter(
    (e) =>
      isMe ||
      e.fixture.lockedAt !== null ||
      lockTimeFor(e.fixture.kickoff, lockOffset).getTime() <= now.getTime(),
  );
  const hidden = entries.length - visible.length;

  const scored = entries.filter((e) => e.points !== null);
  const points = scored.reduce((acc, e) => acc + (e.points ?? 0), 0);
  const exact = competition
    ? scored.filter(
        (e) =>
          e.points === competition.pointsExact ||
          e.points === competition.pointsExact + competition.pointsDrawBonus,
      ).length
    : 0;

  return (
    <div className="space-y-5">
      <Link href={`/saas/${tenant.slug}/ranking`} className="text-sm text-muted hover:text-ink">
        ← Clasificación
      </Link>

      <section className="rounded-xl border border-line bg-bg-elev p-5 flex items-center gap-4">
        <span className="w-14 h-14 rounded-full bg-accent text-accent-fg grid place-items-center font-display text-xl shrink-0">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl truncate">{name}</h1>
          <p className="text-xs text-muted mt-0.5">
            En la quiniela desde {formatDateTime(target.createdAt)}
            {target.hasPaid ? ' · inscripción confirmada' : ' · inscripción pendiente'}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Puntos" value={String(points)} />
        <Stat label="Pronósticos" value={String(entries.length)} />
        <Stat label="Exactos" value={String(exact)} />
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Pronósticos</h2>
        {visible.length === 0 ? (
          <p className="text-sm text-muted rounded-xl border border-line p-5">
            Todavía no hay pronósticos que mostrar.
          </p>
        ) : (
          <ol className="rounded-xl border border-line bg-bg-elev divide-y divide-line overflow-hidden">
            {visible.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 min-w-0 truncate text-sm">
                  {e.fixture.homeTeam.name} <span className="text-muted">vs</span>{' '}
                  {e.fixture.awayTeam.name}
                </span>
                <span className="tabular-nums text-sm">
                  {e.homeScore}–{e.awayScore}
                </span>
                <span className="font-display tabular-nums w-12 text-right">
                  {e.points === null ? '–' : `+${e.points}`}
                </span>
              </li>
            ))}
          </ol>
        )}
        {hidden > 0 && (
          <p className="text-xs text-muted">🔒 Se ocultan {hidden} pronósticos de partidos aún abiertos.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-elev p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="font-display text-2xl mt-1 tabular-nums">{value}</p>
    </div>
  );
}
