import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const session = await auth();
  const meId = session!.user.id;
  const isMe = params.id === meId;

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, createdAt: true, hasPaid: true },
  });
  if (!target) notFound();

  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const offsetMs = (rules?.lockOffsetMin ?? 15) * 60_000;
  const lockedTimeThreshold = new Date(Date.now() + offsetMs);

  // Solo predicciones de partidos cerrados (no se ven las abiertas)
  const visiblePredictions = await prisma.prediction.findMany({
    where: {
      userId: target.id,
      OR: [
        { match: { lockedAt: { not: null } } },
        { match: { status: { not: 'SCHEDULED' } } },
        { match: { kickoff: { lte: lockedTimeThreshold } } },
      ],
    },
    include: { match: true },
    orderBy: { match: { kickoff: 'asc' } },
  });

  const totalPredictions = await prisma.prediction.count({ where: { userId: target.id } });
  const totalPoints = await prisma.prediction.aggregate({
    where: { userId: target.id, points: { not: null } },
    _sum: { points: true },
  });
  const exact = await prisma.prediction.count({ where: { userId: target.id, points: 3 } });

  const hiddenCount = totalPredictions - visiblePredictions.length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link href="/ranking" className="text-sm text-muted hover:text-ink">← Ranking</Link>

      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-bg-elev border border-line flex items-center justify-center font-display text-xl">
          {(target.name?.[0] ?? target.email[0] ?? '?').toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-3xl">
            {target.name ?? 'Sin nombre'}
            {isMe && <span className="text-muted text-sm ml-2 font-sans">· tú</span>}
          </h1>
          <p className="text-xs text-muted mt-1">
            Miembro desde {formatDateTime(target.createdAt)}
            {target.hasPaid ? ' · Pagado' : ' · Pendiente de pago'}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Puntos" value={totalPoints._sum.points ?? 0} highlight />
        <Stat label="Pronósticos" value={totalPredictions} />
        <Stat label="Marcadores exactos" value={exact} />
      </section>

      <section>
        <h2 className="font-display text-2xl mb-3">Su quiniela</h2>
        {visiblePredictions.length === 0 ? (
          <p className="text-sm text-muted">
            Aún no hay pronósticos públicos de este jugador.{' '}
            {hiddenCount > 0 && (
              <span>
                Tiene <strong className="text-ink">{hiddenCount}</strong> pronóstico{hiddenCount !== 1 && 's'} para partidos
                que aún no han cerrado.
              </span>
            )}
          </p>
        ) : (
          <>
            {hiddenCount > 0 && (
              <p className="text-xs text-muted mb-2">
                🔒 Se ocultan <strong className="text-ink">{hiddenCount}</strong> pronóstico{hiddenCount !== 1 && 's'} de partidos
                que aún no han cerrado.
              </p>
            )}
            <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
              {visiblePredictions.map((p, i) => {
                const m = p.match;
                const stageLabel =
                  m.group === 'LIGA' ? 'La Liga' : m.stage === 'GROUP' && m.group ? `Grupo ${m.group}` : STAGE_LABEL[m.stage] ?? m.stage;
                return (
                  <Link
                    key={p.id}
                    href={`/partidos/${m.id}`}
                    className={'flex items-center gap-3 px-4 py-3 hover:bg-bg ' + (i > 0 ? 'border-t border-line' : '')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted">{stageLabel} · {formatDateTime(m.kickoff)}</p>
                      <p className="text-sm truncate">
                        {m.homeTeam} <span className="text-muted">vs</span> {m.awayTeam}
                      </p>
                    </div>
                    <span className="font-display tabular-nums text-base w-14 text-center">
                      {p.homeScore}–{p.awayScore}
                    </span>
                    <span className="font-display tabular-nums text-xs w-16 text-right text-muted">
                      {m.status === 'FINISHED' && m.homeScore !== null ? `${m.homeScore}–${m.awayScore}` : '—'}
                    </span>
                    <span
                      className={
                        'text-xs w-16 text-right font-semibold ' +
                        (p.points === 3 ? 'text-success' : p.points === 1 ? 'text-warning' : p.points === null ? 'text-muted' : 'text-muted')
                      }
                    >
                      {p.points === null ? '—' : `+${p.points} pts`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-bg-elev p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={'font-display text-3xl tabular-nums mt-1 ' + (highlight ? 'text-accent' : '')}>{value}</p>
    </div>
  );
}
