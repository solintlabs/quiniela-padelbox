/**
 * Semanas del torneo. Lunes-Domingo ancladas al inicio del Mundial.
 *
 * Semana 1: del día de arranque del torneo (puede ser cualquier día) hasta
 * el domingo siguiente inclusive. Si arranca lunes, semana 1 son 7 días.
 * Si arranca jueves, semana 1 son 4 días (parcial).
 *
 * Semanas 2..N: lunes-domingo completos.
 *
 * Convención: las fechas se comparan en UTC para evitar saltos de zona
 * horaria. El día de la semana se calcula con getUTCDay() (0 = domingo, 1 = lunes).
 */

export interface WeekRange {
  weekNumber: number;
  /** Inicio del rango, inclusive (00:00:00 UTC del primer día). */
  start: Date;
  /** Fin del rango, exclusivo (00:00:00 UTC del lunes siguiente). */
  end: Date;
  isPartial: boolean;
  /** Etiqueta lista para UI: "10 jun - 14 jun" */
  label: string;
}

function startOfUTCDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

function nextMondayAfter(d: Date): Date {
  const start = startOfUTCDay(d);
  const dow = start.getUTCDay(); // 0..6, 0=domingo
  // Lunes = 1. Si hoy es lunes, el SIGUIENTE lunes es +7.
  const daysUntilNextMonday = dow === 1 ? 7 : (8 - dow) % 7 || 7;
  return addDays(start, daysUntilNextMonday);
}

const MONTH_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatRange(start: Date, endExclusive: Date): string {
  const endInclusive = addDays(endExclusive, -1);
  const sd = start.getUTCDate();
  const sm = MONTH_ABBR[start.getUTCMonth()];
  const ed = endInclusive.getUTCDate();
  const em = MONTH_ABBR[endInclusive.getUTCMonth()];
  if (sm === em) return `${sd} - ${ed} ${em}`;
  return `${sd} ${sm} - ${ed} ${em}`;
}

/**
 * Devuelve el rango de una semana concreta del torneo.
 */
export function getWeekRange(weekNumber: number, tournamentStart: Date): WeekRange {
  if (weekNumber < 1) throw new Error('weekNumber debe ser >= 1');
  const tournamentStartDay = startOfUTCDay(tournamentStart);
  const firstMonday = nextMondayAfter(tournamentStartDay);

  let start: Date;
  let end: Date;
  let isPartial = false;

  if (weekNumber === 1) {
    start = tournamentStartDay;
    end = firstMonday;
    isPartial = end.getTime() - start.getTime() < 7 * 86_400_000;
  } else {
    start = addDays(firstMonday, (weekNumber - 2) * 7);
    end = addDays(start, 7);
  }

  return {
    weekNumber,
    start,
    end,
    isPartial,
    label: formatRange(start, end),
  };
}

/**
 * Devuelve el número de semana al que pertenece una fecha cualquiera.
 * Si la fecha es anterior al inicio del torneo, devuelve 0.
 */
export function getWeekFromDate(date: Date, tournamentStart: Date): number {
  const target = startOfUTCDay(date);
  const tournamentStartDay = startOfUTCDay(tournamentStart);
  if (target.getTime() < tournamentStartDay.getTime()) return 0;

  const firstMonday = nextMondayAfter(tournamentStartDay);
  if (target.getTime() < firstMonday.getTime()) return 1;

  const daysSinceFirstMonday = Math.floor(
    (target.getTime() - firstMonday.getTime()) / 86_400_000,
  );
  return 2 + Math.floor(daysSinceFirstMonday / 7);
}

/**
 * Devuelve la semana "actual" basada en `now`. Si el torneo no ha empezado,
 * devuelve 1 (la primera semana, todavía sin partidos).
 */
export function getCurrentWeek(now: Date, tournamentStart: Date): number {
  const w = getWeekFromDate(now, tournamentStart);
  return Math.max(1, w);
}

/**
 * Devuelve la lista de semanas hasta `tournamentEnd` (exclusivo).
 * Si no se proporciona end, devuelve 6 semanas (suficiente para Mundial 2026).
 */
export function getAllWeeks(tournamentStart: Date, tournamentEnd?: Date): WeekRange[] {
  const maxWeeks = 8;
  const weeks: WeekRange[] = [];
  for (let i = 1; i <= maxWeeks; i++) {
    const w = getWeekRange(i, tournamentStart);
    if (tournamentEnd && w.start.getTime() >= tournamentEnd.getTime()) break;
    weeks.push(w);
  }
  return weeks;
}
