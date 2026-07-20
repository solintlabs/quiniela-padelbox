import type { SaasCompetition } from '@prisma/client';
import { prisma } from '@/lib/db';
import { calcPoints, outcome, type Score } from '@/lib/scoring';

/**
 * Puntuación de las competiciones del SaaS.
 *
 * El núcleo NO se reimplementa: se delega en `calcPoints` de lib/scoring.ts,
 * que es pura y sigue siendo la fuente de verdad del exacto/ganador. Lo que
 * cambia aquí es de dónde salen los parámetros (de cada SaasCompetition, no
 * del singleton Rules id=1) y que el organizador puede sumar reglas extra.
 */

/**
 * Reglas de puntuación que configura el organizador.
 *
 * Con los extras a 0 —el default— el resultado es idéntico al de PADELBOX.
 * Hay un test que verifica esa equivalencia caso por caso, para que ampliar
 * el sistema no cambie por accidente lo que ya funciona.
 */
export interface SaasScoringRules {
  /** Marcador clavado. Excluyente: no acumula con los parciales. */
  pointsExact: number;
  /** Acertar quién gana (o empate). */
  pointsWinner: number;
  /** Acertar la diferencia de goles sin clavar el marcador. */
  pointsGoalDiff: number;
  /** Por CADA equipo cuyo número de goles aciertas (0, 1 o 2 veces). */
  pointsTeamScore: number;
  /** Extra por clavar un empate: es el resultado más difícil de acertar. */
  pointsDrawBonus: number;
}

export const DEFAULT_SAAS_RULES: SaasScoringRules = {
  pointsExact: 3,
  pointsWinner: 1,
  pointsGoalDiff: 0,
  pointsTeamScore: 0,
  pointsDrawBonus: 0,
};

function isExactHit(prediction: Score, actual: Score): boolean {
  return (
    prediction.homeScore === actual.homeScore && prediction.awayScore === actual.awayScore
  );
}

/**
 * Puntos de un pronóstico con las reglas de una competición.
 *
 * Orden de aplicación:
 *   1. Marcador exacto → pointsExact (+ pointsDrawBonus si además era empate).
 *      Es EXCLUYENTE: no se le suman los parciales, o clavar el resultado
 *      podría pagar menos que fallarlo con estilo.
 *   2. Si no es exacto, se SUMAN los parciales que apliquen: ganador,
 *      diferencia de goles y goles acertados por equipo.
 *
 * Puro: sin DB, sin reloj, sin red.
 */
export function calcSaasPoints(
  prediction: Score,
  actual: Score,
  rules: SaasScoringRules = DEFAULT_SAAS_RULES,
): number {
  // Entradas inválidas (NaN, Infinity): no se puntúa nada. Mismo criterio que
  // calcPoints, comprobado aquí antes de sumar extras.
  if (
    !Number.isFinite(prediction.homeScore) ||
    !Number.isFinite(prediction.awayScore) ||
    !Number.isFinite(actual.homeScore) ||
    !Number.isFinite(actual.awayScore)
  ) {
    return 0;
  }

  const core = calcPoints(prediction, actual, rules);
  const exact = isExactHit(prediction, actual);
  const drew = outcome(actual) === 'DRAW';

  if (exact) {
    return rules.pointsExact + (drew ? rules.pointsDrawBonus : 0);
  }

  let points = core; // pointsWinner si acertó el 1X2, 0 si no

  if (rules.pointsGoalDiff !== 0) {
    const predictedDiff = prediction.homeScore - prediction.awayScore;
    const actualDiff = actual.homeScore - actual.awayScore;
    if (predictedDiff === actualDiff) points += rules.pointsGoalDiff;
  }

  if (rules.pointsTeamScore !== 0) {
    if (prediction.homeScore === actual.homeScore) points += rules.pointsTeamScore;
    if (prediction.awayScore === actual.awayScore) points += rules.pointsTeamScore;
  }

  return points;
}

/** Extrae las reglas de una competición. */
export function rulesOf(
  competition: Pick<
    SaasCompetition,
    'pointsExact' | 'pointsWinner' | 'pointsGoalDiff' | 'pointsTeamScore' | 'pointsDrawBonus'
  >,
): SaasScoringRules {
  return {
    pointsExact: competition.pointsExact,
    pointsWinner: competition.pointsWinner,
    pointsGoalDiff: competition.pointsGoalDiff,
    pointsTeamScore: competition.pointsTeamScore,
    pointsDrawBonus: competition.pointsDrawBonus,
  };
}

/**
 * Explica en una frase cómo puntúa una competición. Se le muestra al jugador
 * para que sepa a qué juega sin tener que preguntar al organizador.
 */
export function describeRules(rules: SaasScoringRules): string[] {
  const lines = [
    `${rules.pointsExact} pts por marcador exacto`,
    `${rules.pointsWinner} pt${rules.pointsWinner === 1 ? '' : 's'} por acertar el ganador`,
  ];
  if (rules.pointsGoalDiff !== 0) {
    lines.push(`${rules.pointsGoalDiff} pts por acertar la diferencia de goles`);
  }
  if (rules.pointsTeamScore !== 0) {
    lines.push(`${rules.pointsTeamScore} pts por cada equipo cuyo marcador aciertes`);
  }
  if (rules.pointsDrawBonus !== 0) {
    lines.push(`${rules.pointsDrawBonus} pts extra por clavar un empate`);
  }
  return lines;
}

/** Momento en que se cierran los pronósticos de un partido. Puro. */
export function lockTimeFor(kickoff: Date, lockOffsetMin: number): Date {
  return new Date(kickoff.getTime() - lockOffsetMin * 60_000);
}

/** ¿Está cerrado ya? Puro, sin reloj implícito: el `now` se pasa siempre. */
export function isFixtureLocked(kickoff: Date, lockOffsetMin: number, now: Date): boolean {
  return lockTimeFor(kickoff, lockOffsetMin).getTime() <= now.getTime();
}

/**
 * ¿Se puede guardar un pronóstico para este partido?
 * Puro, y es la regla que evita la trampa más obvia: pronosticar con el
 * partido empezado.
 */
export function canSubmitEntry(
  fixture: { kickoff: Date; lockedAt: Date | null; status: string },
  lockOffsetMin: number,
  now: Date,
): { allowed: boolean; reason?: 'locked' | 'started' } {
  if (fixture.lockedAt !== null) return { allowed: false, reason: 'locked' };
  if (fixture.status !== 'SCHEDULED') return { allowed: false, reason: 'started' };
  if (isFixtureLocked(fixture.kickoff, lockOffsetMin, now)) {
    return { allowed: false, reason: 'locked' };
  }
  return { allowed: true };
}

/**
 * Cierra los partidos cuyo momento de cierre ya pasó.
 * Una sola escritura por competición; idempotente (solo toca lockedAt null).
 */
export async function lockDueFixtures(
  competition: Pick<SaasCompetition, 'id' | 'lockOffsetMin'>,
  now = new Date(),
): Promise<number> {
  const cutoff = new Date(now.getTime() + competition.lockOffsetMin * 60_000);
  const { count } = await prisma.saasFixture.updateMany({
    where: {
      competitionId: competition.id,
      lockedAt: null,
      kickoff: { lte: cutoff },
    },
    data: { lockedAt: now },
  });
  return count;
}

export interface ScoreResult {
  fixturesScored: number;
  entriesScored: number;
}

/**
 * Puntúa los partidos finalizados que aún no se han puntuado.
 *
 * El sello `scoredAt` se reclama con un updateMany atómico: si dos crons
 * coinciden, solo uno lo consigue y no se duplica trabajo ni notificaciones.
 * Escribir los puntos en sí es idempotente (mismo input, mismo resultado).
 */
export async function scoreCompetition(competitionId: string): Promise<ScoreResult> {
  const competition = await prisma.saasCompetition.findUnique({
    where: { id: competitionId },
  });
  if (!competition) throw new Error(`Competición ${competitionId} no encontrada`);

  const rules = rulesOf(competition);

  const fixtures = await prisma.saasFixture.findMany({
    where: {
      competitionId,
      status: 'FINISHED',
      scoredAt: null,
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: { entries: true },
  });

  let entriesScored = 0;
  let fixturesScored = 0;

  for (const fixture of fixtures) {
    for (const entry of fixture.entries) {
      const points = calcSaasPoints(
        { homeScore: entry.homeScore, awayScore: entry.awayScore },
        { homeScore: fixture.homeScore!, awayScore: fixture.awayScore! },
        rules,
      );
      if (entry.points !== points) {
        await prisma.saasEntry.update({ where: { id: entry.id }, data: { points } });
      }
      entriesScored++;
    }

    const claim = await prisma.saasFixture.updateMany({
      where: { id: fixture.id, scoredAt: null },
      data: { scoredAt: new Date() },
    });
    if (claim.count > 0) fixturesScored++;
  }

  return { fixturesScored, entriesScored };
}

/** Recalcula TODO desde cero. Para cuando el organizador corrige un resultado. */
export async function recomputeCompetition(competitionId: string): Promise<ScoreResult> {
  const competition = await prisma.saasCompetition.findUnique({
    where: { id: competitionId },
  });
  if (!competition) throw new Error(`Competición ${competitionId} no encontrada`);

  const rules = rulesOf(competition);

  const fixtures = await prisma.saasFixture.findMany({
    where: {
      competitionId,
      status: 'FINISHED',
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: { entries: true },
  });

  let entriesScored = 0;
  for (const fixture of fixtures) {
    for (const entry of fixture.entries) {
      const points = calcSaasPoints(
        { homeScore: entry.homeScore, awayScore: entry.awayScore },
        { homeScore: fixture.homeScore!, awayScore: fixture.awayScore! },
        rules,
      );
      if (entry.points !== points) {
        await prisma.saasEntry.update({ where: { id: entry.id }, data: { points } });
        entriesScored++;
      }
    }
    if (!fixture.scoredAt) {
      await prisma.saasFixture.update({
        where: { id: fixture.id },
        data: { scoredAt: new Date() },
      });
    }
  }

  return { fixturesScored: fixtures.length, entriesScored };
}
