'use client';

import { useState } from 'react';
import { outcome, type Score } from '@/lib/scoring';
import { calcSaasPoints, type SaasScoringRules } from '@/lib/saas/scoring-core';

/** Reglas de ejemplo del boleto: exacto 5, ganador 2, diferencia 1, equipo 1, empate +3. */
const DEMO_RULES: SaasScoringRules = {
  pointsExact: 5,
  pointsWinner: 2,
  pointsGoalDiff: 1,
  pointsTeamScore: 1,
  pointsDrawBonus: 3,
};

const ACTUAL: Score = { homeScore: 1, awayScore: 3 };

/** Explica el porqué de los puntos (solo texto; los puntos salen de calcSaasPoints). */
function explain(pick: Score): string {
  if (pick.homeScore === ACTUAL.homeScore && pick.awayScore === ACTUAL.awayScore) {
    return 'Marcador exacto';
  }
  const parts: string[] = [];
  if (outcome(pick) === outcome(ACTUAL)) parts.push('ganador');
  if (pick.homeScore - pick.awayScore === ACTUAL.homeScore - ACTUAL.awayScore) parts.push('diferencia');
  if (pick.homeScore === ACTUAL.homeScore) parts.push('goles del local');
  if (pick.awayScore === ACTUAL.awayScore) parts.push('goles del visitante');
  return parts.length ? `Aciertas: ${parts.join(' + ')}` : 'Ningún acierto';
}

export function ScoringDemo() {
  const [pick, setPick] = useState<Score>({ homeScore: 1, awayScore: 3 });
  const [pop, setPop] = useState(false);

  function bump(side: 'homeScore' | 'awayScore', delta: number) {
    setPick((p) => ({ ...p, [side]: Math.max(0, Math.min(9, p[side] + delta)) }));
    setPop(true);
    window.setTimeout(() => setPop(false), 340);
  }

  const points = calcSaasPoints(pick, ACTUAL, DEMO_RULES);

  return (
    <div className="slipwrap rise" id="demo">
      <p className="res__l live">Demo en vivo · cambia el marcador</p>
      <div className="slip">
        <div className="slip__h">
          <span>Jornada 1 · LaLiga</span>
          <span>Boleto de prueba</span>
        </div>
        <div className="slip__b">
          <div className="match">
            <div className="match__teams">
              <div className="team">
                <span className="team__n">Girona</span>
                <span className="team__m">Local</span>
              </div>
              <div className="team team--a">
                <span className="team__n">Rayo Vallecano</span>
                <span className="team__m">Visitante</span>
              </div>
            </div>
            <div className="score">
              <div className="stepper">
                <button type="button" onClick={() => bump('homeScore', 1)} aria-label="Subir goles de Girona">+</button>
                <button type="button" onClick={() => bump('homeScore', -1)} aria-label="Bajar goles de Girona">−</button>
              </div>
              <span className="score__v">{pick.homeScore}</span>
              <span className="score__s">–</span>
              <span className="score__v">{pick.awayScore}</span>
              <div className="stepper">
                <button type="button" onClick={() => bump('awayScore', 1)} aria-label="Subir goles de Rayo Vallecano">+</button>
                <button type="button" onClick={() => bump('awayScore', -1)} aria-label="Bajar goles de Rayo Vallecano">−</button>
              </div>
            </div>
          </div>
          <p className="final">Resultado real: <b className="num">1–3</b></p>
          <div className="res">
            <span className="res__l">Tu puntuación</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
              <p className="res__w">{explain(pick)}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '.35rem' }}>
                <span className={`res__n${pop ? ' pop' : ''}`}>{points}</span>
                <span className="small">pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
