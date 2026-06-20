import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';
import { UserPredictionsList, type PredRow } from '@/components/UserPredictionsList';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const session = await auth();
  const meId = session!.user.id;
  const isMe = params.id === meId;

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, createdAt: true, hasPaid: true,
      championPick: true, championLockedAt: true,
    },
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

  // Filas serializadas para el componente cliente (orden conmutable).
  const predRows: PredRow[] = visiblePredictions.map((p) => {
    const m = p.match;
    const stageLabel =
      m.group === 'LIGA' ? 'La Liga' : m.stage === 'GROUP' && m.group ? `Grupo ${m.group}` : STAGE_LABEL[m.stage] ?? m.stage;
    return {
      id: p.id,
      matchId: m.id,
      stageLabel,
      kickoff: m.kickoff.toISOString(),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      predHome: p.homeScore,
      predAway: p.awayScore,
      realHome: m.homeScore,
      realAway: m.awayScore,
      finished: m.status === 'FINISHED',
      points: p.points,
    };
  });

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

      {/* Campeón predicho — solo visible si esta congelado (anti-trampa pre-Mundial) */}
      {target.championLockedAt && target.championPick && (
        <section className="rounded-xl border-2 border-accent/40 bg-accent/10 p-5 flex items-center gap-3">
          <span className="text-3xl">🏆</span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-bold">
              SU CAMPEÓN
            </p>
            <p className="font-display text-2xl mt-1">{target.championPick}</p>
          </div>
        </section>
      )}

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
            <UserPredictionsList rows={predRows} />
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
