import { describe, it, expect } from 'vitest';
import { lockTimeFor, isFixtureLocked, canSubmitEntry } from '@/lib/saas/scoring';
import { rankRows } from '@/lib/saas/ranking';
import { calcPoints } from '@/lib/scoring';

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

describe('la fórmula de puntos es la misma que la de PADELBOX', () => {
  it('reusa calcPoints con la config de cada competición', () => {
    // El SaaS no reimplementa nada: cambia solo de dónde salen los números.
    const custom = { pointsExact: 5, pointsWinner: 2 };
    expect(calcPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 }, custom)).toBe(5);
    expect(calcPoints({ homeScore: 3, awayScore: 1 }, { homeScore: 2, awayScore: 1 }, custom)).toBe(2);
    expect(calcPoints({ homeScore: 0, awayScore: 1 }, { homeScore: 2, awayScore: 1 }, custom)).toBe(0);
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
      3,
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
      3,
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
      3,
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
      3,
    );
    expect(rows.map((r) => r.position)).toEqual([1, 2, 2, 4]);
  });

  it('no cuenta como jugados los pronósticos aún sin puntuar', () => {
    const rows = rankRows([base({ id: 'ana', points: [3, null, null] })], 3);
    expect(rows[0].played).toBe(1);
    expect(rows[0].points).toBe(3);
  });

  it('quien no ha pronosticado aparece con cero, no desaparece', () => {
    // Importa: un jugador recién invitado debe verse en la tabla.
    const rows = rankRows([base({ id: 'nuevo', points: [] })], 3);
    expect(rows[0].points).toBe(0);
    expect(rows[0].position).toBe(1);
  });

  it('cuenta los exactos según el valor configurado, no un 3 fijo', () => {
    const rows = rankRows([base({ id: 'ana', points: [5, 2] })], 5);
    expect(rows[0].exact).toBe(1);
  });

  it('sin participantes devuelve lista vacía', () => {
    expect(rankRows([], 3)).toEqual([]);
  });
});
