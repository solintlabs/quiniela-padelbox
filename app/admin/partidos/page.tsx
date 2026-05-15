import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';
import { calcPoints } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

async function syncMatches() {
  'use server';
  const url = (process.env.AUTH_URL ?? 'http://localhost:3000') + '/api/admin/sync-matches';
  await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, cache: 'no-store' });
  revalidatePath('/admin/partidos');
}

async function recompute() {
  'use server';
  const url = (process.env.AUTH_URL ?? 'http://localhost:3000') + '/api/admin/recompute';
  await fetch(url, { method: 'POST', cache: 'no-store' });
  revalidatePath('/admin/partidos');
}

async function updateScore(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const homeScore = parseInt(String(formData.get('homeScore') ?? ''), 10);
  const awayScore = parseInt(String(formData.get('awayScore') ?? ''), 10);
  const status = String(formData.get('status') ?? 'FINISHED') as
    | 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  if (!id || !Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return;

  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const pointsExact = rules?.pointsExact ?? 3;
  const pointsWinner = rules?.pointsWinner ?? 1;

  await prisma.match.update({
    where: { id },
    data: {
      homeScore,
      awayScore,
      status,
      ...(status === 'FINISHED' ? { scoredAt: new Date() } : {}),
    },
  });

  if (status === 'FINISHED') {
    const preds = await prisma.prediction.findMany({ where: { matchId: id } });
    for (const p of preds) {
      const points = calcPoints(
        { homeScore: p.homeScore, awayScore: p.awayScore },
        { homeScore, awayScore },
        { pointsExact, pointsWinner },
      );
      await prisma.prediction.update({ where: { id: p.id }, data: { points } });
    }
  }
  revalidatePath('/admin/partidos');
}

export default async function PartidosAdmin() {
  const matches = await prisma.match.findMany({
    orderBy: { kickoff: 'asc' },
    take: 200,
    include: { _count: { select: { predictions: true } } },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Partidos</h1>
          <p className="text-sm text-muted mt-1">
            {matches.length} en base de datos · sincroniza con ESPN o introduce resultados a mano.
          </p>
        </div>
        <div className="flex gap-2">
          <form action={syncMatches}>
            <Button>Sincronizar ESPN</Button>
          </form>
          <form action={recompute}>
            <Button variant="secondary">Recalcular puntos</Button>
          </form>
        </div>
      </header>

      <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
        <strong>Editor manual:</strong> si la API de ESPN falla o tarda en publicar un resultado,
        introduce el marcador a mano. Al marcar como <em>Finalizado</em> se recalculan
        automáticamente los puntos de todas las predicciones de ese partido.
      </div>

      <div className="space-y-2">
        {matches.map((m) => (
          <form
            key={m.id}
            action={updateScore}
            className="rounded-xl border border-line bg-bg-elev p-3 sm:p-4 flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="id" value={m.id} />

            {/* Info partido */}
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs text-muted">
                {formatDateTime(m.kickoff)} ·{' '}
                {m.group === 'LIGA' ? 'La Liga' : m.stage === 'GROUP' && m.group ? `Grupo ${m.group}` : STAGE_LABEL[m.stage] ?? m.stage}
                {m._count.predictions > 0 && (
                  <span className="ml-2 text-accent">· {m._count.predictions} pred.</span>
                )}
              </p>
              <p className="font-semibold text-sm mt-0.5 truncate">
                {m.homeTeam} <span className="text-muted">vs</span> {m.awayTeam}
              </p>
            </div>

            {/* Marcador editable */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                name="homeScore"
                defaultValue={m.homeScore ?? ''}
                min={0}
                max={20}
                placeholder="–"
                className="w-14 h-9 text-center"
              />
              <span className="text-muted">–</span>
              <Input
                type="number"
                name="awayScore"
                defaultValue={m.awayScore ?? ''}
                min={0}
                max={20}
                placeholder="–"
                className="w-14 h-9 text-center"
              />
            </div>

            {/* Estado */}
            <select
              name="status"
              defaultValue={m.status}
              className="h-9 bg-bg border border-line rounded-md text-xs px-2 text-ink"
            >
              <option value="SCHEDULED">Programado</option>
              <option value="LIVE">En juego</option>
              <option value="FINISHED">Finalizado</option>
              <option value="POSTPONED">Aplazado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>

            <Button type="submit" size="sm">Guardar</Button>
          </form>
        ))}
        {matches.length === 0 && (
          <div className="rounded-xl border border-line bg-bg-elev py-8 text-center text-muted">
            Aún no hay partidos. Pulsa <em>Sincronizar ESPN</em>.
          </div>
        )}
      </div>
    </div>
  );
}
