import { prisma } from '@/lib/db';
import { entryScope } from '@/lib/saas/scope';

/**
 * Ranking por competición.
 *
 * Módulo NUEVO: lib/ranking.ts sigue sirviendo a PADELBOX y está atado a
 * User.hasPaid y al pick de campeón global. Aquí el ranking se calcula sobre
 * memberships de un tenant y entries de una competición.
 */

export interface SaasRankingRow {
  membershipId: string;
  userId: string;
  displayName: string;
  played: number;
  exact: number;
  points: number;
  position: number;
}

interface RankingInput {
  membershipId: string;
  userId: string;
  displayName: string;
  joinedAt: Date;
  entries: Array<{ points: number | null }>;
}

/**
 * Ordena y asigna posiciones. Puro y testeable aparte del acceso a datos.
 *
 * Desempate: más puntos → más marcadores exactos → quien se apuntó antes.
 * El último criterio es arbitrario pero estable y no premia al que llega
 * tarde; sin él, dos empatados bailarían de posición en cada recarga.
 *
 * Los empatados comparten posición (1, 2, 2, 4), que es lo que la gente
 * espera de una clasificación deportiva.
 */
export function rankRows(input: RankingInput[], pointsExact: number): SaasRankingRow[] {
  const rows = input.map((row) => {
    const scored = row.entries.filter((e) => e.points !== null);
    return {
      membershipId: row.membershipId,
      userId: row.userId,
      displayName: row.displayName,
      joinedAt: row.joinedAt,
      played: scored.length,
      exact: scored.filter((e) => e.points === pointsExact).length,
      points: scored.reduce((acc, e) => acc + (e.points ?? 0), 0),
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exact !== a.exact) return b.exact - a.exact;
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });

  let lastPosition = 0;
  let lastKey = '';
  return rows.map((row, index) => {
    const key = `${row.points}|${row.exact}`;
    const position = key === lastKey ? lastPosition : index + 1;
    lastPosition = position;
    lastKey = key;

    const { joinedAt: _joinedAt, ...rest } = row;
    return { ...rest, position };
  });
}

/**
 * Ranking completo de una competición.
 *
 * Se pide el tenantId además del competitionId aunque la competición ya lo
 * conozca: así la consulta pasa por entryScope y queda imposible servir por
 * error el ranking de otro comercio.
 */
export async function computeCompetitionRanking(
  tenantId: string,
  competitionId: string,
): Promise<SaasRankingRow[]> {
  const competition = await prisma.saasCompetition.findFirst({
    where: { id: competitionId, tenantId },
    select: { id: true, pointsExact: true },
  });
  if (!competition) return [];

  const memberships = await prisma.saasMembership.findMany({
    where: { tenantId },
    select: { id: true, userId: true, displayName: true, createdAt: true },
  });
  if (memberships.length === 0) return [];

  const entries = await prisma.saasEntry.findMany({
    where: entryScope(tenantId, { fixture: { competitionId } }),
    select: { membershipId: true, points: true },
  });

  const byMembership = new Map<string, Array<{ points: number | null }>>();
  for (const entry of entries) {
    const list = byMembership.get(entry.membershipId) ?? [];
    list.push({ points: entry.points });
    byMembership.set(entry.membershipId, list);
  }

  return rankRows(
    memberships.map((m) => ({
      membershipId: m.id,
      userId: m.userId,
      // El nombre real del User se resuelve en la capa de presentación; aquí
      // no se toca la tabla User.
      displayName: m.displayName ?? '',
      joinedAt: m.createdAt,
      entries: byMembership.get(m.id) ?? [],
    })),
    competition.pointsExact,
  );
}
