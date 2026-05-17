import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';
import { PrintControls } from './PrintControls';

export const metadata = { title: 'Mis pronósticos · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function MyPredictionsPrintPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, predictions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.prediction.findMany({
      where: { userId },
      include: { match: true },
      orderBy: { match: { kickoff: 'asc' } },
    }),
  ]);

  const now = new Date();
  const generatedAt = formatDateTime(now);

  return (
    <div className="max-w-3xl mx-auto print:max-w-full print:mx-0 print:text-black">
      <PrintControls />

      {/* Hoja con colores explicitos (text-black, bg-white) para que se lea
          tanto on-screen en dark mode como al imprimir. No usar text-ink/muted
          aqui porque resuelven a blanco en dark. */}
      <section className="bg-white text-black rounded-xl border border-gray-300 p-8 mt-4 print:border-0 print:rounded-none print:p-0">
        <header className="flex items-start justify-between border-b border-gray-300 pb-4 print:border-black">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-600">Quiniela Mundial 2026</p>
            <h1 className="font-display text-2xl mt-1 text-black">Mis pronósticos</h1>
            <p className="text-sm text-gray-700 mt-1">
              {user?.name ? `${user.name} · ` : ''}
              <span className="font-mono">{user?.email}</span>
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Generado</p>
            <p className="font-mono">{generatedAt}</p>
          </div>
        </header>

        {predictions.length === 0 ? (
          <p className="text-sm text-gray-600 mt-6">Aún no tienes ningún pronóstico.</p>
        ) : (
          <table className="w-full mt-6 text-sm text-black">
            <thead>
              <tr className="border-b border-gray-300 text-xs uppercase tracking-[0.12em] text-gray-600">
                <th className="text-left py-2">Fecha</th>
                <th className="text-left">Fase</th>
                <th className="text-left">Partido</th>
                <th className="text-center w-20">Pronóstico</th>
                <th className="text-center w-20">Resultado</th>
                <th className="text-right w-16">Pts</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => {
                const m = p.match;
                const stage = m.group === 'LIGA'
                  ? 'La Liga'
                  : m.stage === 'GROUP' && m.group
                    ? `Grupo ${m.group}`
                    : STAGE_LABEL[m.stage] ?? m.stage;
                return (
                  <tr key={p.id} className="border-b border-gray-200">
                    <td className="py-2 text-xs whitespace-nowrap">{formatDateTime(m.kickoff)}</td>
                    <td className="text-xs">{stage}</td>
                    <td>
                      {m.homeTeam} <span className="text-gray-500">vs</span> {m.awayTeam}
                    </td>
                    <td className="text-center font-display tabular-nums">
                      {p.homeScore}–{p.awayScore}
                    </td>
                    <td className="text-center font-display tabular-nums">
                      {m.status === 'FINISHED' && m.homeScore !== null
                        ? `${m.homeScore}–${m.awayScore}`
                        : '—'}
                    </td>
                    <td className="text-right tabular-nums">
                      {p.points !== null ? `+${p.points}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black">
                <td colSpan={5} className="text-right font-semibold py-3">Total</td>
                <td className="text-right font-display text-xl tabular-nums py-3">
                  {predictions.reduce((acc, p) => acc + (p.points ?? 0), 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        <footer className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600 print:border-black">
          <p>
            Este documento es un comprobante personal de los pronósticos registrados en
            <strong className="text-black"> Quiniela PADELBOX × DELISH</strong>.
            Los pronósticos oficiales son los que figuran en la base de datos del sistema —
            este PDF puede no incluir cambios posteriores a la fecha de generación.
          </p>
          <p className="mt-1">
            Desarrollado por Solintlabs · S.Baldini · solint.cloud
          </p>
        </footer>
      </section>
    </div>
  );
}
