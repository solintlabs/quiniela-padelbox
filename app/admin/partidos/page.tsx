import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';

export const dynamic = 'force-dynamic';

async function syncMatches() {
  'use server';
  const url = (process.env.AUTH_URL ?? 'http://localhost:3000') + '/api/admin/sync-matches';
  await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
  });
  revalidatePath('/admin/partidos');
}

async function recompute() {
  'use server';
  const url = (process.env.AUTH_URL ?? 'http://localhost:3000') + '/api/admin/recompute';
  await fetch(url, { method: 'POST', cache: 'no-store' });
  revalidatePath('/admin/partidos');
}

export default async function PartidosAdmin() {
  const matches = await prisma.match.findMany({
    orderBy: { kickoff: 'asc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Partidos</h1>
          <p className="text-sm text-muted mt-1">{matches.length} en base de datos · sincroniza con API-Football cuando lo necesites.</p>
        </div>
        <div className="flex gap-2">
          <form action={syncMatches}><Button>Sincronizar API-Football</Button></form>
          <form action={recompute}><Button variant="secondary">Recalcular puntos</Button></form>
        </div>
      </header>

      <div className="rounded-xl border border-line bg-bg-elev overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-muted border-b border-line">
            <tr>
              <th className="text-left py-3 px-4">Fecha</th>
              <th className="text-left">Fase</th>
              <th className="text-left">Local</th>
              <th className="text-left">Visitante</th>
              <th className="text-right">Resultado</th>
              <th className="text-right pr-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {matches.map((m) => (
              <tr key={m.id}>
                <td className="py-3 px-4 text-muted">{formatDateTime(m.kickoff)}</td>
                <td>{m.stage === 'GROUP' && m.group ? `Grupo ${m.group}` : STAGE_LABEL[m.stage] ?? m.stage}</td>
                <td>{m.homeTeam}</td>
                <td>{m.awayTeam}</td>
                <td className="text-right font-display tabular-nums">
                  {m.homeScore !== null && m.awayScore !== null ? `${m.homeScore} – ${m.awayScore}` : '—'}
                </td>
                <td className="text-right pr-4 text-xs">{m.status}</td>
              </tr>
            ))}
            {matches.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  Aún no hay partidos. Pulsa <em>Sincronizar API-Football</em>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
