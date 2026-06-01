import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { PdfExportButton } from '@/app/(app)/cuadro/PdfExportButton';
import { STAGE_LABEL } from '@/lib/format';

export const dynamic = 'force-dynamic';

const MUNDIAL_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const KNOCKOUT_STAGES = ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'] as const;

export default async function AdminUserCuadro({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, hasPaid: true, championPick: true },
  });
  if (!user) notFound();

  const matches = await prisma.match.findMany({
    where: { excludeFromScoring: false, group: { in: MUNDIAL_GROUPS } },
    orderBy: { kickoff: 'asc' },
    include: {
      predictions: {
        where: { userId: id },
        select: { homeScore: true, awayScore: true },
      },
    },
  });

  // Eliminatorias con predicción (cuando existan)
  const knockout = await prisma.match.findMany({
    where: { excludeFromScoring: false, stage: { in: [...KNOCKOUT_STAGES] } },
    orderBy: { kickoff: 'asc' },
    include: {
      predictions: { where: { userId: id }, select: { homeScore: true, awayScore: true } },
    },
  });

  type M = (typeof matches)[number];
  const sections: Array<{ title: string; items: M[] }> = [];
  for (const g of MUNDIAL_GROUPS) {
    const gm = matches.filter((m) => m.group === g);
    if (gm.length > 0) sections.push({ title: `Grupo ${g}`, items: gm });
  }
  for (const stage of KNOCKOUT_STAGES) {
    const sm = knockout.filter((m) => m.stage === stage);
    if (sm.length > 0) sections.push({ title: STAGE_LABEL[stage] ?? stage, items: sm });
  }

  const totalMatches = matches.length + knockout.length;
  const predicted =
    matches.filter((m) => m.predictions[0]).length +
    knockout.filter((m) => m.predictions[0]).length;

  let counter = 0;
  const label = user.name ?? user.email;

  return (
    <div className="space-y-5">
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/usuarios" className="text-xs text-accent hover:underline">
            ← Volver a usuarios
          </Link>
          <h1 className="font-display text-2xl mt-1">Cuadro de {label}</h1>
          <p className="text-sm text-muted mt-1">
            {predicted}/{totalMatches} pronosticados ·{' '}
            {user.hasPaid ? (
              <span className="text-success">pagado</span>
            ) : (
              <span className="text-warning">pendiente de pago</span>
            )}
            {user.championPick && <> · campeón: {user.championPick}</>}
          </p>
        </div>
        <PdfExportButton userId={user.id} />
      </div>

      {/* Cabecera para impresion */}
      <div className="only-print print-header">
        <h1>Quiniela · {label}</h1>
        <p>
          {user.email} · {predicted}/{totalMatches} pronosticados
          {user.championPick && ` · Campeón: ${user.championPick}`}
        </p>
      </div>

      <div className="print-matches-list-screen space-y-5">
        {sections.map((section) => (
          <div key={section.title} className="print-section rounded-xl border border-line bg-bg-elev p-4">
            <h3 className="font-display text-sm uppercase tracking-wider text-muted mb-2">
              {section.title}
            </h3>
            <ol className="space-y-1">
              {section.items.map((m) => {
                counter += 1;
                const p = m.predictions[0];
                const home = p ? p.homeScore : '—';
                const away = p ? p.awayScore : '—';
                return (
                  <li key={m.id} className="flex items-center gap-2 text-sm tabular-nums">
                    <span className="text-muted w-6 shrink-0">{counter}.</span>
                    <span className="flex-1 text-right truncate">{m.homeTeam}</span>
                    <span className={'font-display px-2 ' + (p ? 'text-ink' : 'text-muted')}>
                      {home}–{away}
                    </span>
                    <span className="flex-1 truncate">{m.awayTeam}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>

      {totalMatches === 0 && (
        <p className="text-sm text-muted text-center py-10">No hay partidos cargados.</p>
      )}
    </div>
  );
}
