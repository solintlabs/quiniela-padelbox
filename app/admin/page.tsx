import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  await requireAdmin();
  const [users, paid, matchesActive, matchesTotal, finishedActive, predictionsActive] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { hasPaid: true } }),
      // Partidos en competiciones activas (los que cuentan para el ranking)
      prisma.match.count({ where: { excludeFromScoring: false } }),
      // Total en DB (incluye Liga desactivada, etc.) para referencia
      prisma.match.count(),
      // Jugados (FINISHED) en competiciones activas
      prisma.match.count({
        where: { status: 'FINISHED', excludeFromScoring: false },
      }),
      // Predicciones de matches en competiciones activas
      prisma.prediction.count({
        where: { match: { excludeFromScoring: false } },
      }),
    ]);

  const excludedMatches = matchesTotal - matchesActive;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Resumen</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Usuarios" value={users} />
        <Stat label="Pagados" value={paid} highlight />
        <Stat
          label="Partidos"
          value={matchesActive}
          hint={excludedMatches > 0 ? `+${excludedMatches} excluidos` : undefined}
        />
        <Stat label="Jugados" value={finishedActive} />
        <Stat label="Predicciones" value={predictionsActive} />
      </div>

      <div className="rounded-xl border border-line p-4">
        <p className="text-sm font-semibold mb-2">Atajos</p>
        <div className="flex gap-2 flex-wrap text-sm">
          <Link
            href="/admin/predicciones"
            className="px-3 py-1.5 rounded-md border border-line hover:bg-bg-elev"
          >
            👀 Ver actividad de predicciones
          </Link>
          <Link
            href="/admin/usuarios"
            className="px-3 py-1.5 rounded-md border border-line hover:bg-bg-elev"
          >
            👤 Usuarios
          </Link>
          <Link
            href="/admin/partidos"
            className="px-3 py-1.5 rounded-md border border-line hover:bg-bg-elev"
          >
            ⚽ Partidos
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  hint,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={'font-display text-3xl tabular-nums mt-1 ' + (highlight ? 'text-accent' : '')}>{value}</p>
      {hint && <p className="text-[10px] text-muted mt-1">{hint}</p>}
    </div>
  );
}
