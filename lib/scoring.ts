/**
 * Sistema de puntos PADELBOX Quiniela:
 *   - Marcador exacto: 3 pts
 *   - Ganador correcto (1X2) pero marcador distinto: 1 pt
 *   - Fallo (ganador erróneo): 0 pts
 *
 * Esta es la ÚNICA fuente de verdad para calcular puntos.
 * Cualquier cambio aquí exige añadir/actualizar tests en tests/scoring.test.ts.
 */

export type Outcome = 'HOME' | 'AWAY' | 'DRAW';

export interface Score {
  homeScore: number;
  awayScore: number;
}

export interface ScoringRules {
  pointsExact: number;
  pointsWinner: number;
}

export const DEFAULT_RULES: ScoringRules = {
  pointsExact: 3,
  pointsWinner: 1,
};

export function outcome(score: Score): Outcome {
  if (score.homeScore > score.awayScore) return 'HOME';
  if (score.homeScore < score.awayScore) return 'AWAY';
  return 'DRAW';
}

/**
 * Calcula los puntos de una predicción contra un resultado real.
 * Devuelve 0 si los inputs son inválidos (NaN/negativos) — el caller debe validar antes.
 */
export function calcPoints(
  prediction: Score,
  actual: Score,
  rules: ScoringRules = DEFAULT_RULES,
): number {
  if (
    !Number.isFinite(prediction.homeScore) ||
    !Number.isFinite(prediction.awayScore) ||
    !Number.isFinite(actual.homeScore) ||
    !Number.isFinite(actual.awayScore)
  ) {
    return 0;
  }

  if (
    prediction.homeScore === actual.homeScore &&
    prediction.awayScore === actual.awayScore
  ) {
    return rules.pointsExact;
  }

  if (outcome(prediction) === outcome(actual)) {
    return rules.pointsWinner;
  }

  return 0;
}
