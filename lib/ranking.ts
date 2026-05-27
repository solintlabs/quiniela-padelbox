import { prisma } from '@/lib/db';
import { publicDisplayName } from '@/lib/display';
import { getWeekRange } from '@/lib/weeks';
import type { RankingRow } from '@/components/RankingTable';

/**
 * Calcula el ranking de toda la quiniela.
 * Ordenado por: puntos DESC → marcadores exactos DESC → fecha registro ASC.
 *
 * Para MVP usamos agregación in-process: con 50-100 usuarios y 64 partidos
 * es trivial. Si crece, mover a una vista materializada o query SQL.
 */
export async function computeRanking(): Promise<RankingRow[]> {
  const [users, rules] = await Promise.all([
    prisma.user.findMany({
      where: { hasPaid: true },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        championPick: true,
        championLockedAt: true,
        predictions: {
          where: {
            points: { not: null },
            // No contar predicciones de partidos excluidos del scoring
            // (ej. La Liga desactivada antes del Mundial).
            match: { excludeFromScoring: false },
          },
          select: { points: true },
        },
      },
    }),
    prisma.rules.findUnique({ where: { id: 1 } }),
  ]);

  // Bonus del campeón: solo si admin marcó championWinner y el user lo acertó
  // CON pick congelado (championLockedAt no null — anti-trampa post hoc).
  const championWinner = rules?.championWinner ?? null;
  const championBonus = rules?.pointsChampion ?? 25;

  const rows: (RankingRow & { createdAt: Date })[] = users.map((u) => {
    const played = u.predictions.length;
    const matchPoints = u.predictions.reduce((acc, p) => acc + (p.points ?? 0), 0);
    const exact = u.predictions.filter((p) => p.points === 3).length;

    const wonChampionBonus =
      championWinner &&
      u.championPick === championWinner &&
      u.championLockedAt !== null;
    const points = matchPoints + (wonChampionBonus ? championBonus : 0);

    return {
      userId: u.id,
      name: u.name,
      // Email se envia MASCARADO al cliente — fallback display si no hay name.
      // Esto evita scraping de la lista completa de correos de socios.
      // El admin tiene su propia vista (admin/usuarios) sin mascara.
      email: publicDisplayName({ name: u.name, email: u.email }),
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

/**
 * Ranking restringido a las predicciones cuyo match.kickoff cae dentro
 * de la semana dada. No incluye bonus de campeón (eso es del general).
 *
 * Devuelve null si el torneo no tiene fecha de arranque configurada.
 */
export async function computeWeeklyRanking(weekNumber: number): Promise<RankingRow[] | null> {
  const rules = await prisma.rules.findUnique({ where: { id: 1 }, select: { tournamentStartAt: true } });
  if (!rules?.tournamentStartAt) return null;

  const range = getWeekRange(weekNumber, rules.tournamentStartAt);

  const users = await prisma.user.findMany({
    where: { hasPaid: true },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      predictions: {
        where: {
          points: { not: null },
          match: {
            kickoff: { gte: range.start, lt: range.end },
            excludeFromScoring: false,
          },
        },
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
      email: publicDisplayName({ name: u.name, email: u.email }),
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
