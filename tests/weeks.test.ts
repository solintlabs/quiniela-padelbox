import { describe, it, expect } from 'vitest';
import {
  getWeekRange,
  getWeekFromDate,
  getCurrentWeek,
  getAllWeeks,
} from '@/lib/weeks';

// Mundial 2026 oficial: 11 jun 2026 (jueves)
const WC = new Date('2026-06-11T16:00:00.000Z');

describe('getWeekRange', () => {
  it('semana 1 va del jueves de arranque al lunes siguiente (4 días, parcial)', () => {
    const w = getWeekRange(1, WC);
    expect(w.start.toISOString().slice(0, 10)).toBe('2026-06-11');
    expect(w.end.toISOString().slice(0, 10)).toBe('2026-06-15'); // Lun
    expect(w.isPartial).toBe(true);
    expect(w.label).toContain('jun');
  });

  it('semana 2 es Lun-Lun completa', () => {
    const w = getWeekRange(2, WC);
    expect(w.start.toISOString().slice(0, 10)).toBe('2026-06-15');
    expect(w.end.toISOString().slice(0, 10)).toBe('2026-06-22');
    expect(w.isPartial).toBe(false);
  });

  it('semana 3 sigue 7 días después de semana 2', () => {
    const w = getWeekRange(3, WC);
    expect(w.start.toISOString().slice(0, 10)).toBe('2026-06-22');
    expect(w.end.toISOString().slice(0, 10)).toBe('2026-06-29');
  });
});

describe('getWeekFromDate', () => {
  it('antes del torneo devuelve 0', () => {
    expect(getWeekFromDate(new Date('2026-06-10T12:00:00Z'), WC)).toBe(0);
  });

  it('el mismo día de arranque es semana 1', () => {
    expect(getWeekFromDate(new Date('2026-06-11T20:00:00Z'), WC)).toBe(1);
  });

  it('domingo siguiente al arranque es semana 1', () => {
    expect(getWeekFromDate(new Date('2026-06-14T22:00:00Z'), WC)).toBe(1);
  });

  it('lunes siguiente es semana 2', () => {
    expect(getWeekFromDate(new Date('2026-06-15T09:00:00Z'), WC)).toBe(2);
  });

  it('un mes después calcula la semana correcta', () => {
    // 13 jul 2026 → 5 semanas después
    // Sem1: 11-14 jun, Sem2: 15-21, Sem3: 22-28, Sem4: 29 jun - 5 jul,
    // Sem5: 6-12 jul, Sem6: 13-19 jul
    expect(getWeekFromDate(new Date('2026-07-13T12:00:00Z'), WC)).toBe(6);
  });
});

describe('getCurrentWeek', () => {
  it('si torneo no ha empezado, devuelve 1', () => {
    expect(getCurrentWeek(new Date('2026-06-09T12:00:00Z'), WC)).toBe(1);
  });
});

describe('getAllWeeks', () => {
  it('genera 8 semanas por defecto', () => {
    const weeks = getAllWeeks(WC);
    expect(weeks.length).toBe(8);
    expect(weeks[0].weekNumber).toBe(1);
    expect(weeks[7].weekNumber).toBe(8);
  });

  it('corta en tournamentEnd', () => {
    const end = new Date('2026-07-19T23:59:59Z'); // final del Mundial
    const weeks = getAllWeeks(WC, end);
    expect(weeks.length).toBeLessThanOrEqual(8);
    expect(weeks.every((w) => w.start.getTime() < end.getTime())).toBe(true);
  });
});

describe('caso edge: torneo arranca lunes', () => {
  const monStart = new Date('2026-01-05T12:00:00.000Z'); // 5 ene 2026 = lunes
  it('semana 1 dura 7 días completos', () => {
    const w = getWeekRange(1, monStart);
    expect(w.isPartial).toBe(false);
    expect(w.start.toISOString().slice(0, 10)).toBe('2026-01-05');
    expect(w.end.toISOString().slice(0, 10)).toBe('2026-01-12');
  });
});

describe('caso edge: torneo arranca domingo', () => {
  const sunStart = new Date('2026-06-14T12:00:00.000Z'); // domingo
  it('semana 1 dura 1 día (parcial)', () => {
    const w = getWeekRange(1, sunStart);
    expect(w.isPartial).toBe(true);
    expect(w.start.toISOString().slice(0, 10)).toBe('2026-06-14');
    expect(w.end.toISOString().slice(0, 10)).toBe('2026-06-15');
  });
});
