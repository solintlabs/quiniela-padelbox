import type { SaasCompetition } from '@prisma/client';
import { calcPoints, outcome, type Score } from '@/lib/scoring';

/**
 * Núcleo PURO de la puntuación del SaaS. Sin DB, sin prisma, sin red — por eso
 * vive separado de scoring.ts: así se puede importar tanto desde el servidor
 * (cron de scoring) como desde el cliente (la demo interactiva de la landing)
 * sin arrastrar `prisma` al bundle del navegador.
 *
 * El núcleo del exacto/ganador NO se reimplementa: se delega en `calcPoints`
 * de lib/scoring.ts, que sigue siendo la fuente de verdad. Aquí solo cambia de
 * dónde salen los parámetros y que el organizador puede sumar reglas extra.
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
