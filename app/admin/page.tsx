import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  await requireAdmin();
  const [users, paid, matches, finished, predictions] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { hasPaid: true } }),
    prisma.match.count(),
    prisma.match.count({ where: { status: 'FINISHED' } }),
    prisma.prediction.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Resumen</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Usuarios" value={users} />
        <Stat label="Pagados" value={paid} highlight />
        <Stat label="Partidos" value={matches} />
        <Stat label="Jugados" value={finished} />
        <Stat label="Predicciones" value={predictions} />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-line p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={'font-display text-3xl tabular-nums mt-1 ' + (highlight ? 'text-accent' : '')}>{value}</p>
    </div>
  );
}
