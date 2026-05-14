import { prisma } from '@/lib/db';
import { calcPoints } from '@/lib/scoring';
import { fetchWorldCupFixtures, mapRound, mapStatus } from '@/lib/api-football';

/** Sync con API-Football: upsert por apiFootballId. */
export async function syncMatchesFromApi() {
  const fixtures = await fetchWorldCupFixtures();
  let created = 0;
  let updated = 0;

  for (const fx of fixtures) {
    const round = mapRound(fx.league.round);
    const status = mapStatus(fx.fixture.status.short);
    const data = {
      apiFootballId: fx.fixture.id,
      stage: round.stage,
      group: round.group ?? null,
      kickoff: new Date(fx.fixture.date),
      homeTeam: fx.teams.home.name,
      awayTeam: fx.teams.away.name,
      homeFlag: fx.teams.home.logo,
      awayFlag: fx.teams.away.logo,
      homeScore: fx.goals.home,
      awayScore: fx.goals.away,
      status,
    };

    const existing = await prisma.match.findUnique({
      where: { apiFootballId: data.apiFootballId },
    });
    if (existing) {
      await prisma.match.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.match.create({ data });
      created++;
    }
  }

  return { created, updated, total: fixtures.length };
}

/**
 * Cierra pronósticos de partidos cuyo kickoff - offset ya pasó.
 * Calcula puntos de partidos FINISHED que aún no tengan scoredAt.
 */
export async function lockAndScore() {
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const offsetMs = (rules?.lockOffsetMin ?? 15) * 60_000;
  const pointsExact = rules?.pointsExact ?? 3;
  const pointsWinner = rules?.pointsWinner ?? 1;
  const now = Date.now();

  // 1. Bloqueo por hora
  const toLock = await prisma.match.findMany({
    where: { lockedAt: null, kickoff: { lte: new Date(now + offsetMs) } },
    select: { id: true },
  });
  if (toLock.length) {
    await prisma.match.updateMany({
      where: { id: { in: toLock.map((m) => m.id) } },
      data: { lockedAt: new Date() },
    });
  }

  // 2. Cierre de pick de campeón
  if (rules?.tournamentStartAt && rules.tournamentStartAt.getTime() <= now) {
    await prisma.user.updateMany({
      where: { championLockedAt: null, championPick: { not: null } },
      data: { championLockedAt: new Date() },
    });
  }

  // 3. Scoring
  const toScore = await prisma.match.findMany({
    where: { status: 'FINISHED', scoredAt: null, homeScore: { not: null }, awayScore: { not: null } },
    include: { predictions: true },
  });
  let scored = 0;
  for (const m of toScore) {
    for (const p of m.predictions) {
      const points = calcPoints(
        { homeScore: p.homeScore, awayScore: p.awayScore },
        { homeScore: m.homeScore!, awayScore: m.awayScore! },
        { pointsExact, pointsWinner },
      );
      await prisma.prediction.update({ where: { id: p.id }, data: { points } });
      scored++;
    }
    await prisma.match.update({ where: { id: m.id }, data: { scoredAt: new Date() } });
  }

  return { locked: toLock.length, scored, scoredMatches: toScore.length };
}

/** Recalcula puntos de TODOS los partidos finalizados (admin manual). */
export async function recomputeAll() {
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const pointsExact = rules?.pointsExact ?? 3;
  const pointsWinner = rules?.pointsWinner ?? 1;

  const matches = await prisma.match.findMany({
    where: { status: 'FINISHED', homeScore: { not: null }, awayScore: { not: null } },
    include: { predictions: true },
  });
  let updated = 0;
  for (const m of matches) {
    for (const p of m.predictions) {
      const points = calcPoints(
        { homeScore: p.homeScore, awayScore: p.awayScore },
        { homeScore: m.homeScore!, awayScore: m.awayScore! },
        { pointsExact, pointsWinner },
      );
      if (p.points !== points) {
        await prisma.prediction.update({ where: { id: p.id }, data: { points } });
        updated++;
      }
    }
    if (!m.scoredAt) {
      await prisma.match.update({ where: { id: m.id }, data: { scoredAt: new Date() } });
    }
  }
  return { matches: matches.length, predictionsUpdated: updated };
}
