import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { BatchGroupForm } from '@/components/BatchGroupForm';

export const metadata = { title: 'Rellenar fase de grupos · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function PredecirGruposPage() {
  const session = await auth();
  const userId = session!.user.id;
  const hasPaid = session!.user.hasPaid;

  const matches = await prisma.match.findMany({
    where: { stage: 'GROUP' },
    orderBy: { kickoff: 'asc' },
    include: {
      predictions: {
        where: { userId },
        select: { homeScore: true, awayScore: true },
      },
    },
  });

  const offsetMs = 15 * 60_000;
  const now = Date.now();
  const items = matches.map((m) => ({
    id: m.id,
    group: m.group,
    kickoff: m.kickoff.toISOString(),
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeFlag: m.homeFlag,
    awayFlag: m.awayFlag,
    isLocked: !!m.lockedAt || m.status !== 'SCHEDULED' || new Date(m.kickoff).getTime() - offsetMs <= now,
    initial: m.predictions[0] ? { homeScore: m.predictions[0].homeScore, awayScore: m.predictions[0].awayScore } : null,
  }));

  return (
    <div className="space-y-6">
      <header>
        <Link href="/" className="text-sm text-muted hover:text-ink">← Inicio</Link>
        <h1 className="font-display text-3xl mt-3">Rellena tu quiniela</h1>
        <p className="text-sm text-muted mt-2 max-w-xl">
          Pronostica los {items.length} partidos de la fase de grupos del Mundial 2026 de una sola vez.
          Puedes editar cualquier partido más tarde hasta 15 minutos antes de su kickoff.
        </p>
      </header>

      {!hasPaid ? (
        <div className="rounded-xl border-2 border-warning/50 bg-warning/10 p-5">
          <p className="font-semibold">⚠ Tu cuenta aún no está activa</p>
          <p className="text-sm text-muted mt-2">
            No podrás guardar pronósticos hasta que confirmemos tu inscripción.{' '}
            <Link href="/inscripcion" className="text-accent underline">
              Ver métodos de pago →
            </Link>
          </p>
        </div>
      ) : (
        <BatchGroupForm matches={items} total={items.length} />
      )}
    </div>
  );
}
