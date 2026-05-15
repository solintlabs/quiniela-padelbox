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
 * ¿Hay un partido en curso o que terminó hace menos de 4h?
 * Se usa para decidir si lock-and-score debe sincronizar con API-Football
 * (sync inteligente — evita quemar rate limit en horas muertas).
 *
 * Ventana: [kickoff-30min .. kickoff+4h]
 *   - 30 min antes del kickoff para capturar el cambio SCHEDULED → LIVE.
 *   - 4h después del kickoff cubre prórroga, penaltis y delay de API-Football
 *     en publicar el FT (full time).
 */
async function hasMatchInWindow(): Promise<boolean> {
  const now = Date.now();
  const windowStart = new Date(now - 4 * 60 * 60 * 1000);  // hace 4h
  const windowEnd   = new Date(now + 30 * 60 * 1000);       // dentro de 30min

  const count = await prisma.match.count({
    where: {
      AND: [
        { kickoff: { gte: windowStart, lte: windowEnd } },
        { status: { not: 'CANCELLED' } },
        // Si ya tiene scoredAt, no merece la pena re-sync (puntos ya calculados).
        { OR: [{ scoredAt: null }, { status: 'LIVE' }] },
      ],
    },
  });
  return count > 0;
}

/**
 * Cierra pronósticos de partidos cuyo kickoff - offset ya pasó.
 * Calcula puntos de partidos FINISHED que aún no tengan scoredAt.
 * Si hay un partido en curso o reciente, hace sync con API-Football antes
 * para tener los resultados frescos (sync inteligente — no consume rate
 * limit en horas sin actividad).
 */
export async function lockAndScore() {
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const offsetMs = (rules?.lockOffsetMin ?? 15) * 60_000;
  const pointsExact = rules?.pointsExact ?? 3;
  const pointsWinner = rules?.pointsWinner ?? 1;
  const now = Date.now();

  // 0. Sync inteligente: solo si hay partido cerca.
  let synced: false | Awaited<ReturnType<typeof syncMatchesFromApi>> = false;
  if (process.env.API_FOOTBALL_KEY && (await hasMatchInWindow())) {
    try {
      synced = await syncMatchesFromApi();
    } catch (e) {
      // Si falla, no rompemos el cron: el siguiente intento lo recuperará.
      console.error('[lock-and-score] sync API-Football fallo:', e instanceof Error ? e.message : e);
    }
  }

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

  return { synced, locked: toLock.length, scored, scoredMatches: toScore.length };
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
