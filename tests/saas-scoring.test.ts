import { describe, it, expect } from 'vitest';
import { lockTimeFor, isFixtureLocked, canSubmitEntry } from '@/lib/saas/scoring';
import { rankRows } from '@/lib/saas/ranking';
import { calcPoints } from '@/lib/scoring';
import { calcSaasPoints, DEFAULT_SAAS_RULES, describeRules, type SaasScoringRules } from '@/lib/saas/scoring';

const NOW = new Date('2026-08-15T17:00:00Z');
const KICKOFF = new Date('2026-08-15T18:00:00Z');

describe('lockTimeFor', () => {
  it('resta el margen configurado al kickoff', () => {
    expect(lockTimeFor(KICKOFF, 15).toISOString()).toBe('2026-08-15T17:45:00.000Z');
  });

  it('con margen 0 cierra justo al empezar', () => {
    expect(lockTimeFor(KICKOFF, 0).getTime()).toBe(KICKOFF.getTime());
  });

  it('cada competición puede tener su propio margen', () => {
    expect(lockTimeFor(KICKOFF, 60).toISOString()).toBe('2026-08-15T17:00:00.000Z');
  });
});

describe('isFixtureLocked', () => {
  it('una hora antes con margen de 15 min todavía está abierto', () => {
    expect(isFixtureLocked(KICKOFF, 15, NOW)).toBe(false);
  });

  it('pasado el momento de cierre está cerrado', () => {
    expect(isFixtureLocked(KICKOFF, 15, new Date('2026-08-15T17:46:00Z'))).toBe(true);
  });

  it('justo en el instante de cierre ya está cerrado', () => {
    expect(isFixtureLocked(KICKOFF, 15, new Date('2026-08-15T17:45:00Z'))).toBe(true);
  });
});

describe('canSubmitEntry', () => {
  const open = { kickoff: KICKOFF, lockedAt: null, status: 'SCHEDULED' };

  it('deja pronosticar con tiempo de sobra', () => {
    expect(canSubmitEntry(open, 15, NOW)).toEqual({ allowed: true });
  });

  it('no deja si ya se cerró por hora', () => {
    expect(canSubmitEntry(open, 15, new Date('2026-08-15T17:50:00Z'))).toEqual({
      allowed: false,
      reason: 'locked',
    });
  });

  it('no deja si el cron ya marcó lockedAt', () => {
    expect(canSubmitEntry({ ...open, lockedAt: new Date() }, 15, NOW)).toEqual({
      allowed: false,
      reason: 'locked',
    });
  });

  it('no deja con el partido empezado aunque el reloj diga otra cosa', () => {
    // Red de seguridad: si ESPN adelanta el estado a LIVE, no se pronostica
    // aunque el kickoff guardado fuese posterior.
    expect(canSubmitEntry({ ...open, status: 'LIVE' }, 15, NOW)).toEqual({
      allowed: false,
      reason: 'started',
    });
  });
});

describe('calcSaasPoints — equivalencia con PADELBOX', () => {
  /** Todos los cruces de marcadores 0..4 contra 0..4. */
  const allPairs: Array<[number, number, number, number]> = [];
  for (let ph = 0; ph <= 4; ph++)
    for (let pa = 0; pa <= 4; pa++)
      for (let ah = 0; ah <= 4; ah++)
        for (let aa = 0; aa <= 4; aa++) allPairs.push([ph, pa, ah, aa]);

  it('con los extras apagados da EXACTAMENTE lo mismo que calcPoints, en los 625 casos', () => {
    // Esta es la red que impide que ampliar el sistema cambie por accidente
    // lo que ya funciona en producción.
    for (const [ph, pa, ah, aa] of allPairs) {
      const prediction = { homeScore: ph, awayScore: pa };
      const actual = { homeScore: ah, awayScore: aa };
      expect(calcSaasPoints(prediction, actual, DEFAULT_SAAS_RULES)).toBe(
        calcPoints(prediction, actual, { pointsExact: 3, pointsWinner: 1 }),
      );
    }
  });

  it('entradas inválidas no puntúan', () => {
    expect(calcSaasPoints({ homeScore: NaN, awayScore: 0 }, { homeScore: 1, awayScore: 0 })).toBe(0);
    expect(calcSaasPoints({ homeScore: 1, awayScore: 0 }, { homeScore: Infinity, awayScore: 0 })).toBe(0);
  });
});

describe('calcSaasPoints — reglas que elige el organizador', () => {
  const rules = (over: Partial<SaasScoringRules> = {}): SaasScoringRules => ({
    ...DEFAULT_SAAS_RULES,
    ...over,
  });

  it('el organizador puede subir el ganador de 1 a 5 puntos', () => {
    const r = rules({ pointsWinner: 5 });
    expect(calcSaasPoints({ homeScore: 3, awayScore: 0 }, { homeScore: 1, awayScore: 0 }, r)).toBe(5);
  });

  it('puntos por acertar la diferencia de goles', () => {
    const r = rules({ pointsGoalDiff: 2 });
    // 2-0 pronosticado, 3-1 real: mismo ganador (+1) y misma diferencia (+2).
    expect(calcSaasPoints({ homeScore: 2, awayScore: 0 }, { homeScore: 3, awayScore: 1 }, r)).toBe(3);
  });

  it('la diferencia también cuenta si falló el ganador... salvo que sea imposible', () => {
    // Con distinta diferencia no suma nada extra.
    const r = rules({ pointsGoalDiff: 2 });
    expect(calcSaasPoints({ homeScore: 3, awayScore: 0 }, { homeScore: 1, awayScore: 1 }, r)).toBe(0);
  });

  it('puntos por cada equipo cuyo marcador aciertas', () => {
    const r = rules({ pointsTeamScore: 1 });
    // 2-1 pronosticado, 2-3 real: acierta los goles del local (+1), falla
    // ganador. Total 1.
    expect(calcSaasPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 3 }, r)).toBe(1);
  });

  it('los parciales se acumulan entre sí', () => {
    const r = rules({ pointsWinner: 1, pointsGoalDiff: 2, pointsTeamScore: 1 });
    // 2-0 vs 3-1: ganador (1) + diferencia (2) + ningún marcador clavado = 3.
    expect(calcSaasPoints({ homeScore: 2, awayScore: 0 }, { homeScore: 3, awayScore: 1 }, r)).toBe(3);
  });

  it('el exacto es EXCLUYENTE: no acumula parciales', () => {
    // Si acumulara, clavar el marcador pagaría 3+2+2=7 y desequilibraría el
    // sistema respecto a lo que el organizador cree haber configurado.
    const r = rules({ pointsExact: 3, pointsGoalDiff: 2, pointsTeamScore: 1 });
    expect(calcSaasPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 }, r)).toBe(3);
  });

  it('clavar el marcador nunca puede pagar menos que fallarlo', () => {
    const r = rules({ pointsExact: 3, pointsWinner: 1, pointsGoalDiff: 2, pointsTeamScore: 1 });
    const exacto = calcSaasPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 }, r);
    const casi = calcSaasPoints({ homeScore: 3, awayScore: 2 }, { homeScore: 2, awayScore: 1 }, r);
    expect(exacto).toBeGreaterThanOrEqual(casi);
  });

  it('bonus extra por clavar un empate', () => {
    const r = rules({ pointsDrawBonus: 2 });
    expect(calcSaasPoints({ homeScore: 1, awayScore: 1 }, { homeScore: 1, awayScore: 1 }, r)).toBe(5);
    // Un exacto que no es empate no se lleva el bonus.
    expect(calcSaasPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 }, r)).toBe(3);
  });
});

describe('describeRules', () => {
  it('explica solo las reglas activas', () => {
    const lines = describeRules(DEFAULT_SAAS_RULES);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('3 pts por marcador exacto');
  });

  it('añade una línea por cada regla que el organizador enciende', () => {
    const lines = describeRules({
      pointsExact: 5,
      pointsWinner: 2,
      pointsGoalDiff: 1,
      pointsTeamScore: 1,
      pointsDrawBonus: 3,
    });
    expect(lines).toHaveLength(5);
    expect(lines.join(' ')).toContain('diferencia de goles');
    expect(lines.join(' ')).toContain('empate');
  });
});

describe('rankRows', () => {
  const base = (over: Partial<{ id: string; points: (number | null)[]; joined: string }>) => ({
    membershipId: over.id ?? 'm1',
    userId: `u-${over.id ?? 'm1'}`,
    displayName: over.id ?? 'm1',
    joinedAt: new Date(over.joined ?? '2026-01-01T00:00:00Z'),
    entries: (over.points ?? []).map((p) => ({ points: p })),
  });

  it('ordena por puntos descendente', () => {
    const rows = rankRows(
      [
        base({ id: 'ana', points: [1, 1] }),
        base({ id: 'luis', points: [3, 3] }),
        base({ id: 'eva', points: [3, 1] }),
      ],
      [3],
    );
    expect(rows.map((r) => r.displayName)).toEqual(['luis', 'eva', 'ana']);
    expect(rows[0].points).toBe(6);
  });

  it('desempata por marcadores exactos', () => {
    // Ambos suman 4, pero uno lo hizo con un exacto (3+1) y otro con cuatro
    // aciertos de ganador: premia al que afinó más.
    const rows = rankRows(
      [
        base({ id: 'cuatro-unos', points: [1, 1, 1, 1] }),
        base({ id: 'un-exacto', points: [3, 1] }),
      ],
      [3],
    );
    expect(rows[0].displayName).toBe('un-exacto');
    expect(rows[0].exact).toBe(1);
  });

  it('con puntos y exactos iguales gana quien se apuntó antes', () => {
    const rows = rankRows(
      [
        base({ id: 'tarde', points: [3], joined: '2026-03-01T00:00:00Z' }),
        base({ id: 'pronto', points: [3], joined: '2026-01-01T00:00:00Z' }),
      ],
      [3],
    );
    expect(rows.map((r) => r.displayName)).toEqual(['pronto', 'tarde']);
  });

  it('los empatados comparten posición y la siguiente salta (1,2,2,4)', () => {
    const rows = rankRows(
      [
        base({ id: 'a', points: [3, 3] }),
        base({ id: 'b', points: [3] }),
        base({ id: 'c', points: [3] }),
        base({ id: 'd', points: [1] }),
      ],
      [3],
    );
    expect(rows.map((r) => r.position)).toEqual([1, 2, 2, 4]);
  });

  it('no cuenta como jugados los pronósticos aún sin puntuar', () => {
    const rows = rankRows([base({ id: 'ana', points: [3, null, null] })], [3]);
    expect(rows[0].played).toBe(1);
    expect(rows[0].points).toBe(3);
  });

  it('quien no ha pronosticado aparece con cero, no desaparece', () => {
    // Importa: un jugador recién invitado debe verse en la tabla.
    const rows = rankRows([base({ id: 'nuevo', points: [] })], [3]);
    expect(rows[0].points).toBe(0);
    expect(rows[0].position).toBe(1);
  });

  it('cuenta los exactos según el valor configurado, no un 3 fijo', () => {
    const rows = rankRows([base({ id: 'ana', points: [5, 2] })], [5]);
    expect(rows[0].exact).toBe(1);
  });

  it('sin participantes devuelve lista vacía', () => {
    expect(rankRows([], [3])).toEqual([]);
  });
});
