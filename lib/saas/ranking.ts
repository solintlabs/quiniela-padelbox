import { prisma } from '@/lib/db';
import { publicDisplayName } from '@/lib/display';
import { entryScope } from '@/lib/saas/scope';

/**
 * Ranking por competición.
 *
 * Módulo NUEVO: lib/ranking.ts sigue sirviendo a PADELBOX y está atado a
 * User.hasPaid y al pick de campeón global. Aquí el ranking se calcula sobre
 * memberships de un tenant y entries de una competición.
 */

export interface ChampionInfo {
  name: string;
  logoUrl: string | null;
  /** El pick coincidió con el campeón fijado por el organizador. */
  correct: boolean;
}

export interface SaasRankingRow {
  membershipId: string;
  userId: string;
  displayName: string;
  played: number;
  exact: number;
  points: number;
  position: number;
  champion: ChampionInfo | null;
}

interface RankingInput {
  membershipId: string;
  userId: string;
  displayName: string;
  joinedAt: Date;
  entries: Array<{ points: number | null }>;
  /** Puntos de bonus (p. ej. acertar el campeón). Suma a los puntos, no cuenta como jugado ni exacto. */
  bonus: number;
  champion: ChampionInfo | null;
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
export function rankRows(
  input: RankingInput[],
  /**
   * Valores de puntos que cuentan como marcador exacto. Es una lista y no un
   * número porque con el bonus de empate activo un exacto puede valer
   * pointsExact o pointsExact + pointsDrawBonus.
   */
  exactValues: readonly number[],
): SaasRankingRow[] {
  const exactSet = new Set(exactValues);
  const rows = input.map((row) => {
    const scored = row.entries.filter((e) => e.points !== null);
    return {
      membershipId: row.membershipId,
      userId: row.userId,
      displayName: row.displayName,
      joinedAt: row.joinedAt,
      played: scored.length,
      exact: scored.filter((e) => e.points !== null && exactSet.has(e.points)).length,
      points: scored.reduce((acc, e) => acc + (e.points ?? 0), 0) + row.bonus,
      champion: row.champion,
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
    select: {
      id: true,
      pointsExact: true,
      pointsDrawBonus: true,
      pointsBonus: true,
      championWinnerTeamId: true,
    },
  });
  if (!competition) return [];

  const exactValues = [
    competition.pointsExact,
    competition.pointsExact + competition.pointsDrawBonus,
  ];

  const [memberships, entries, picks] = await Promise.all([
    prisma.saasMembership.findMany({
      where: { tenantId },
      select: { id: true, userId: true, displayName: true, createdAt: true },
    }),
    prisma.saasEntry.findMany({
      where: entryScope(tenantId, { fixture: { competitionId } }),
      select: { membershipId: true, points: true },
    }),
    prisma.saasChampionPick.findMany({
      where: { competitionId },
      select: { membershipId: true, teamId: true, team: { select: { name: true, logoUrl: true } } },
    }),
  ]);
  if (memberships.length === 0) return [];

  const byMembership = new Map<string, Array<{ points: number | null }>>();
  for (const entry of entries) {
    const list = byMembership.get(entry.membershipId) ?? [];
    list.push({ points: entry.points });
    byMembership.set(entry.membershipId, list);
  }

  const pickByMembership = new Map(picks.map((p) => [p.membershipId, p]));
  const winner = competition.championWinnerTeamId;

  // Sin displayName propio, el nombre real del User (o su email enmascarado):
  // un ranking lleno de "Jugador" no le sirve a nadie.
  const users = await prisma.user.findMany({
    where: { id: { in: memberships.map((m) => m.userId) } },
    select: { id: true, name: true, email: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return rankRows(
    memberships.map((m) => {
      const pick = pickByMembership.get(m.id);
      // El bonus solo se otorga cuando el organizador ya fijó el campeón y el
      // pick coincide. Antes de eso el pick se muestra pero no puntúa.
      const correct = !!pick && !!winner && pick.teamId === winner;
      const user = userById.get(m.userId);
      return {
        membershipId: m.id,
        userId: m.userId,
        displayName:
          m.displayName ||
          (user ? publicDisplayName({ name: user.name, email: user.email }) : ''),
        joinedAt: m.createdAt,
        entries: byMembership.get(m.id) ?? [],
        bonus: correct ? competition.pointsBonus : 0,
        champion: pick ? { name: pick.team.name, logoUrl: pick.team.logoUrl, correct } : null,
      };
    }),
    exactValues,
  );
}
