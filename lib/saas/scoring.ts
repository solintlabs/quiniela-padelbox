import type { SaasCompetition } from '@prisma/client';
import { prisma } from '@/lib/db';
import { calcSaasPoints, rulesOf } from './scoring-core';

/**
 * Puntuación de las competiciones del SaaS.
 *
 * El núcleo puro (reglas, calcSaasPoints, describeRules, locks) vive en
 * `./scoring-core`, sin prisma, para poder reusarse también en el cliente.
 * Aquí quedan solo las funciones que tocan la DB.
 */
export * from './scoring-core';

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

  const rules = rulesOf(competition);

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
      const points = calcSaasPoints(
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

  const rules = rulesOf(competition);

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
      const points = calcSaasPoints(
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
