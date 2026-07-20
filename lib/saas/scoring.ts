import type { SaasCompetition } from '@prisma/client';
import { prisma } from '@/lib/db';
import { calcPoints } from '@/lib/scoring';

/**
 * Puntuación de las competiciones del SaaS.
 *
 * La fórmula NO se reimplementa: se importa `calcPoints` de lib/scoring.ts,
 * que es pura y sigue siendo la única fuente de verdad. Aquí solo cambia de
 * dónde salen los parámetros — de cada SaasCompetition en vez del singleton
 * Rules id=1 de PADELBOX.
 */

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

  const rules = {
    pointsExact: competition.pointsExact,
    pointsWinner: competition.pointsWinner,
  };

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
      const points = calcPoints(
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

  const rules = {
    pointsExact: competition.pointsExact,
    pointsWinner: competition.pointsWinner,
  };

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
      const points = calcPoints(
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
