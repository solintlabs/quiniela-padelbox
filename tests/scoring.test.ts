import { describe, it, expect } from 'vitest';
import { calcPoints, outcome, DEFAULT_RULES } from '@/lib/scoring';

describe('outcome()', () => {
  it('detecta gana local', () => {
    expect(outcome({ homeScore: 2, awayScore: 1 })).toBe('HOME');
  });
  it('detecta gana visitante', () => {
    expect(outcome({ homeScore: 0, awayScore: 3 })).toBe('AWAY');
  });
  it('detecta empate', () => {
    expect(outcome({ homeScore: 1, awayScore: 1 })).toBe('DRAW');
  });
});

describe('calcPoints() — sistema 3/1/0', () => {
  it('marcador exacto → 3 pts', () => {
    expect(calcPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(3);
  });
  it('empate exacto → 3 pts', () => {
    expect(calcPoints({ homeScore: 0, awayScore: 0 }, { homeScore: 0, awayScore: 0 })).toBe(3);
  });
  it('ganador correcto pero marcador distinto → 1 pt', () => {
    expect(calcPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 3, awayScore: 0 })).toBe(1);
  });
  it('predicción de empate y resultado de empate distinto → 1 pt', () => {
    expect(calcPoints({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 2 })).toBe(1);
  });
  it('ganador erróneo → 0 pts (pensó local, ganó visitante)', () => {
    expect(calcPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 0, awayScore: 2 })).toBe(0);
  });
  it('ganador erróneo → 0 pts (pensó empate, hubo ganador)', () => {
    expect(calcPoints({ homeScore: 1, awayScore: 1 }, { homeScore: 3, awayScore: 1 })).toBe(0);
  });
  it('ganador erróneo → 0 pts (pensó ganador, hubo empate)', () => {
    expect(calcPoints({ homeScore: 2, awayScore: 0 }, { homeScore: 1, awayScore: 1 })).toBe(0);
  });
  it('respeta reglas custom', () => {
    expect(
      calcPoints(
        { homeScore: 2, awayScore: 1 },
        { homeScore: 2, awayScore: 1 },
        { pointsExact: 5, pointsWinner: 2 },
      ),
    ).toBe(5);
    expect(
      calcPoints(
        { homeScore: 2, awayScore: 1 },
        { homeScore: 4, awayScore: 0 },
        { pointsExact: 5, pointsWinner: 2 },
      ),
    ).toBe(2);
  });
  it('inputs inválidos (NaN) → 0 pts', () => {
    expect(calcPoints({ homeScore: NaN, awayScore: 1 }, { homeScore: 1, awayScore: 1 })).toBe(0);
  });
  it('DEFAULT_RULES son 3/1', () => {
    expect(DEFAULT_RULES.pointsExact).toBe(3);
    expect(DEFAULT_RULES.pointsWinner).toBe(1);
  });
});
