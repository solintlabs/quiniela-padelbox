import type { SaasCompetition, SaasFixture } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  fetchFixtures,
  teamsFromFixtures,
  type EspnFixture,
  type EspnTeamRef,
} from '@/lib/saas/providers/espn';

/**
 * Importación y sincronización de competiciones del SaaS.
 *
 * Módulo NUEVO. No comparte nada con lib/sync.ts, que sigue sirviendo a
 * PADELBOX sin cambios: aquel opera sobre Match/Prediction y el singleton
 * Rules; este solo toca tablas Saas* y lee la configuración de cada
 * SaasCompetition.
 *
 * Todo es idempotente: importar dos veces el mismo rango no duplica equipos ni
 * partidos, y no escribe si nada cambió (Neon factura por tiempo de cómputo,
 * y en horas muertas ESPN devuelve exactamente lo mismo).
 */

export interface ImportResult {
  teamsCreated: number;
  fixturesCreated: number;
  fixturesUpdated: number;
  /** La foto de ESPN vino incompleta: no se marca la competición como sincronizada. */
  partial: boolean;
  skipped?: 'not-espn' | 'no-slug';
}

/** Solo los campos de `patch` que difieren de lo que ya hay guardado. */
function changedFields<T extends Record<string, unknown>>(
  current: Record<string, unknown>,
  patch: T,
): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(patch)) {
    const now = current[key];
    const equal =
      value instanceof Date && now instanceof Date
        ? value.getTime() === now.getTime()
        : now === value;
    if (!equal) out[key as keyof T] = value as T[keyof T];
  }
  return out;
}

/** Crea o actualiza los equipos y devuelve el mapa espnId → id interno. */
async function upsertTeams(
  competitionId: string,
  teams: EspnTeamRef[],
): Promise<{ idByEspnId: Map<string, string>; created: number }> {
  const existing = await prisma.saasTeam.findMany({
    where: { competitionId, espnId: { in: teams.map((t) => t.espnId) } },
  });
  const byEspnId = new Map(existing.map((t) => [t.espnId ?? '', t]));

  const idByEspnId = new Map<string, string>();
  let created = 0;

  for (const team of teams) {
    const current = byEspnId.get(team.espnId);

    if (!current) {
      const fresh = await prisma.saasTeam.create({
        data: {
          competitionId,
          espnId: team.espnId,
          name: team.name,
          shortName: team.shortName,
          logoUrl: team.logoUrl,
        },
      });
      idByEspnId.set(team.espnId, fresh.id);
      created++;
      continue;
    }

    // El nombre o el escudo pueden cambiar en ESPN (rebrandings, ascensos).
    const patch = changedFields(current, {
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl,
    });
    if (Object.keys(patch).length > 0) {
      await prisma.saasTeam.update({ where: { id: current.id }, data: patch });
    }
    idByEspnId.set(team.espnId, current.id);
  }

  return { idByEspnId, created };
}

/**
 * Qué campos puede pisar el proveedor en un partido que ya existe.
 *
 * Puro y testeable aparte porque aquí vive la regla que más daño hace si se
 * equivoca: sobrescribir un resultado que el organizador fijó a mano, o
 * degradar a SCHEDULED un partido ya puntuado porque ESPN tuvo un hipo.
 */
export function fixturePatchFor(
  current: Pick<SaasFixture, 'manualResult' | 'scoredAt' | 'status'>,
  incoming: {
    kickoff: Date;
    round: string | null;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
    status: SaasFixture['status'];
  },
): Record<string, unknown> {
  // Datos de calendario: siempre se aceptan, no afectan a la puntuación.
  const schedule = {
    kickoff: incoming.kickoff,
    round: incoming.round,
    homeTeamId: incoming.homeTeamId,
    awayTeamId: incoming.awayTeamId,
  };

  // El organizador fijó el resultado a mano: el proveedor no lo toca.
  if (current.manualResult) return schedule;

  // Ya terminado y puntuado, y ahora ESPN dice que no está terminado:
  // es un estado transitorio suyo, no una corrección. No degradar.
  if (current.scoredAt && current.status === 'FINISHED' && incoming.status !== 'FINISHED') {
    return schedule;
  }

  return {
    ...schedule,
    homeScore: incoming.homeScore,
    awayScore: incoming.awayScore,
    status: incoming.status,
  };
}

async function upsertFixtures(
  competition: SaasCompetition,
  fixtures: EspnFixture[],
  idByEspnId: Map<string, string>,
): Promise<{ created: number; updated: number }> {
  const externalIds = fixtures.map((f) => f.externalId);
  const existing = await prisma.saasFixture.findMany({
    where: { competitionId: competition.id, externalId: { in: externalIds } },
  });
  const byExternalId = new Map(existing.map((f) => [f.externalId ?? '', f]));

  let created = 0;
  let updated = 0;

  for (const fixture of fixtures) {
    const homeTeamId = idByEspnId.get(fixture.home.espnId);
    const awayTeamId = idByEspnId.get(fixture.away.espnId);
    if (!homeTeamId || !awayTeamId) continue; // equipo no resuelto: se salta

    const current = byExternalId.get(fixture.externalId);

    if (!current) {
      await prisma.saasFixture.create({
        data: {
          competitionId: competition.id,
          externalId: fixture.externalId,
          source: 'ESPN',
          homeTeamId,
          awayTeamId,
          kickoff: fixture.kickoff,
          round: fixture.round,
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
          status: fixture.status,
        },
      });
      created++;
      continue;
    }

    const patch = fixturePatchFor(current, {
      kickoff: fixture.kickoff,
      round: fixture.round,
      homeTeamId,
      awayTeamId,
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      status: fixture.status,
    });

    const diff = changedFields(current, patch);
    if (Object.keys(diff).length > 0) {
      await prisma.saasFixture.update({ where: { id: current.id }, data: diff });
      updated++;
    }
  }

  return { created, updated };
}

/**
 * Importa equipos y partidos de una competición ESPN en el rango dado.
 * Se usa tanto en el alta (temporada completa) como en el cron (ventana corta).
 */
export async function importCompetitionFixtures(
  competitionId: string,
  range: { start: Date; end: Date },
): Promise<ImportResult> {
  const competition = await prisma.saasCompetition.findUnique({
    where: { id: competitionId },
  });
  if (!competition) throw new Error(`Competición ${competitionId} no encontrada`);

  const empty: ImportResult = {
    teamsCreated: 0,
    fixturesCreated: 0,
    fixturesUpdated: 0,
    partial: false,
  };
  if (competition.provider !== 'ESPN') return { ...empty, skipped: 'not-espn' };
  if (!competition.espnSlug) return { ...empty, skipped: 'no-slug' };

  const { fixtures, partial } = await fetchFixtures(
    competition.espnSlug,
    range.start,
    range.end,
  );
  if (fixtures.length === 0) return { ...empty, partial };

  const { idByEspnId, created: teamsCreated } = await upsertTeams(
    competition.id,
    teamsFromFixtures(fixtures),
  );
  const { created, updated } = await upsertFixtures(competition, fixtures, idByEspnId);

  // Solo se sella como sincronizada si la foto vino entera.
  if (!partial) {
    await prisma.saasCompetition.update({
      where: { id: competition.id },
      data: { lastSyncedAt: new Date() },
    });
  }

  return {
    teamsCreated,
    fixturesCreated: created,
    fixturesUpdated: updated,
    partial,
  };
}

/**
 * Días hacia atrás y hacia delante que mira el cron en cada pasada.
 *
 * El "hacia delante" era de 10 días y dejaba quinielas VACÍAS: si la liga está
 * en descanso (p. ej. crear una quiniela de LALIGA en julio, que arranca en
 * agosto) ESPN no devuelve nada en esa ventana y el organizador veía cero
 * partidos. 45 días cubre el parón entre temporadas sin descargar el año entero
 * en cada pasada.
 */
export const SYNC_WINDOW_DAYS_BACK = 3;
export const SYNC_WINDOW_DAYS_AHEAD = 45;

/** Ventana de la PRIMERA importación: trae el calendario ya publicado. */
export const INITIAL_IMPORT_DAYS_AHEAD = 210;

/**
 * Ventana alrededor de ahora. El cron no re-descarga la temporada entera cada
 * vez: solo lo que puede haber cambiado o está por venir.
 */
export function syncWindow(now: Date): { start: Date; end: Date } {
  const start = new Date(now.getTime() - SYNC_WINDOW_DAYS_BACK * 86_400_000);
  const end = new Date(now.getTime() + SYNC_WINDOW_DAYS_AHEAD * 86_400_000);
  return { start, end };
}

/** Ventana amplia para el alta de una competición (o un resync manual). */
export function initialImportWindow(now: Date): { start: Date; end: Date } {
  const start = new Date(now.getTime() - SYNC_WINDOW_DAYS_BACK * 86_400_000);
  const end = new Date(now.getTime() + INITIAL_IMPORT_DAYS_AHEAD * 86_400_000);
  return { start, end };
}

export interface CronSyncResult {
  competitions: number;
  imported: Array<{ id: string; name: string; result: ImportResult }>;
  failed: Array<{ id: string; name: string; error: string }>;
}

/**
 * Recorre las competiciones ESPN abiertas y las sincroniza. Un fallo en una
 * no detiene a las demás: un tenant con la liga rota no puede dejar sin
 * actualizar al resto de clientes.
 */
export async function syncOpenCompetitions(now = new Date()): Promise<CronSyncResult> {
  const competitions = await prisma.saasCompetition.findMany({
    where: { provider: 'ESPN', status: 'OPEN', espnSlug: { not: null } },
    select: { id: true, name: true },
  });

  const window = syncWindow(now);
  const imported: CronSyncResult['imported'] = [];
  const failed: CronSyncResult['failed'] = [];

  for (const competition of competitions) {
    try {
      const result = await importCompetitionFixtures(competition.id, window);
      imported.push({ id: competition.id, name: competition.name, result });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`[saas/sync] ${competition.name} fallo:`, error);
      failed.push({ id: competition.id, name: competition.name, error });
    }
  }

  return { competitions: competitions.length, imported, failed };
}
