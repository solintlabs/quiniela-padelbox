import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Perfil · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

async function updateChampion(formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user) return;
  const pick = String(formData.get('championPick') ?? '').trim();
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const locked = rules?.tournamentStartAt && rules.tournamentStartAt.getTime() <= Date.now();
  if (locked) return;
  await prisma.user.update({
    where: { id: session.user.id },
    data: { championPick: pick || null },
  });
  revalidatePath('/perfil');
}

export default async function PerfilPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const championLocked = !!rules?.tournamentStartAt && rules.tournamentStartAt.getTime() <= Date.now();

  const stats = await prisma.prediction.aggregate({
    where: { userId: user!.id, points: { not: null } },
    _sum: { points: true },
    _count: { _all: true },
  });
  const exact = await prisma.prediction.count({
    where: { userId: user!.id, points: 3 },
  });

  return (
    <div className="max-w-2xl space-y-10">
      <header>
        <h1 className="font-display text-3xl">Tu perfil</h1>
        <p className="text-sm text-muted mt-1">{user!.email}</p>
      </header>

      <section className="rounded-xl border border-line bg-bg-elev p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Estado de inscripción</span>
          {user!.hasPaid ? (
            <span className="text-success font-medium text-sm">✓ Pagado · activado</span>
          ) : (
            <span className="text-warning font-medium text-sm">⚠ Pendiente</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Miembro desde</span>
          <span className="text-sm">{formatDateTime(user!.createdAt)}</span>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-bg-elev p-6">
        <h2 className="font-display text-xl mb-4">Tu campeón del Mundial 🏆</h2>
        <p className="text-sm text-muted mb-4">
          Acertar el campeón vale <span className="text-accent font-semibold">+{rules?.pointsChampion ?? 25} pts</span> extra al ranking final.
          {championLocked
            ? ' Ya no se puede modificar — el torneo ha comenzado.'
            : ' Puedes cambiarlo hasta el primer pitido del Mundial.'}
        </p>
        <form action={updateChampion} className="flex gap-2">
          <Input
            name="championPick"
            defaultValue={user!.championPick ?? ''}
            placeholder="Ej: Argentina"
            disabled={championLocked}
            maxLength={32}
          />
          <Button type="submit" disabled={championLocked}>Guardar</Button>
        </form>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Puntos" value={stats._sum.points ?? 0} highlight />
        <Stat label="Partidos jugados" value={stats._count._all ?? 0} />
        <Stat label="Marcadores exactos" value={exact} />
      </section>

      <MyPredictions userId={user!.id} />
    </div>
  );
}

async function MyPredictions({ userId }: { userId: string }) {
  const predictions = await prisma.prediction.findMany({
    where: { userId },
    include: { match: true },
    orderBy: { match: { kickoff: 'asc' } },
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-2xl">Mis pronósticos</h2>
        {predictions.length > 0 && (
          <Link
            href="/mis-pronosticos/print"
            className="text-xs h-9 px-4 inline-flex items-center rounded-md border border-line hover:border-accent hover:text-accent"
          >
            🖨 Descargar / enviar por WhatsApp
          </Link>
        )}
      </div>
      {predictions.length === 0 ? (
        <p className="text-sm text-muted">
          Aún no has hecho ningún pronóstico. Ve a{' '}
          <Link href="/partidos" className="text-accent underline">
            /partidos
          </Link>{' '}
          para empezar.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-bg-elev">
          {predictions.map((p) => {
            const m = p.match;
            const isLockedByTime = new Date(m.kickoff).getTime() - 15 * 60_000 <= Date.now();
            const isLocked = !!m.lockedAt || m.status !== 'SCHEDULED' || isLockedByTime;
            const isFinished = m.status === 'FINISHED';
            return (
              <li key={p.id} className="px-4 py-3 flex items-center gap-3">
                {m.homeFlag && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.homeFlag} alt="" className="w-6 h-6 rounded-sm shrink-0 object-cover" />
                )}
                <span className="text-sm flex-1 truncate">
                  {m.homeTeam} <span className="text-muted">vs</span> {m.awayTeam}
                </span>
                {m.awayFlag && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.awayFlag} alt="" className="w-6 h-6 rounded-sm shrink-0 object-cover" />
                )}
                <span className="font-display tabular-nums w-16 text-center">
                  {p.homeScore}–{p.awayScore}
                </span>
                <span className="w-24 text-right text-xs">
                  {isFinished && p.points !== null ? (
                    <span
                      className={
                        p.points === 3
                          ? 'text-success font-semibold'
                          : p.points === 1
                            ? 'text-warning'
                            : 'text-muted'
                      }
                    >
                      +{p.points} pts
                    </span>
                  ) : isLocked ? (
                    <span className="text-muted">Esperando</span>
                  ) : (
                    <span className="text-accent">Abierto</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-line p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={'font-display text-3xl tabular-nums mt-1 ' + (highlight ? 'text-accent' : '')}>
        {value}
      </p>
    </div>
  );
}
