import { prisma } from '@/lib/db';
import type { RankingRow } from '@/components/RankingTable';

/**
 * Calcula el ranking de toda la quiniela.
 * Ordenado por: puntos DESC → marcadores exactos DESC → fecha registro ASC.
 *
 * Para MVP usamos agregación in-process: con 50-100 usuarios y 64 partidos
 * es trivial. Si crece, mover a una vista materializada o query SQL.
 */
export async function computeRanking(): Promise<RankingRow[]> {
  const users = await prisma.user.findMany({
    where: { hasPaid: true },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      predictions: {
        where: { points: { not: null } },
        select: { points: true },
      },
    },
  });

  const rows: (RankingRow & { createdAt: Date })[] = users.map((u) => {
    const played = u.predictions.length;
    const points = u.predictions.reduce((acc, p) => acc + (p.points ?? 0), 0);
    const exact = u.predictions.filter((p) => p.points === 3).length;
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      played,
      exact,
      points,
      createdAt: u.createdAt,
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exact !== a.exact) return b.exact - a.exact;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return rows.map(({ createdAt: _c, ...r }) => r);
}
