import { prisma } from '@/lib/db';
import { calcPoints } from '@/lib/scoring';
import { computeRanking } from '@/lib/ranking';
import { fetchWorldCupFixtures, type NormalizedFixture } from '@/lib/providers/espn';
import { sendPushToUsers } from '@/lib/push';

/**
 * Sync con el proveedor externo: upsert por externalId.
 * Si Rules.syncPaused está en true, hace early return — el admin gestiona
 * los partidos manualmente sin que el cron sobreescriba sus ediciones.
 */
export async function syncMatchesFromApi() {
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  if (rules?.syncPaused) {
    return { created: 0, updated: 0, total: 0, paused: true as const };
  }

  const fixtures = await fetchWorldCupFixtures();
  let created = 0;
  let updated = 0;

  for (const fx of fixtures) {
    const data = toDbShape(fx);
    const existing = await prisma.match.findUnique({
      where: { externalId: data.externalId },
    });
    if (existing) {
      if (existing.status === 'FINISHED' && existing.scoredAt && data.status !== 'FINISHED') {
        // Ya terminado Y puntuado: si ESPN devuelve un status raro transitorio
        // (mapStatus default = SCHEDULED), NO degradar el match ni borrar su
        // marcador. Solo refrescamos metadata inofensiva.
        await prisma.match.update({
          where: { id: existing.id },
          data: {
            stage: data.stage,
            group: data.group,
            homeFlag: data.homeFlag,
            awayFlag: data.awayFlag,
            venue: data.venue,
          },
        });
      } else if (existing.manualResult) {
        // Resultado fijado a mano (90 min en eliminatorias): NO tocar
        // marcador/estado. Solo refrescamos equipos/horario/banderas por si
        // ESPN definió el cruce real (sin pisar el resultado del admin).
        await prisma.match.update({
          where: { id: existing.id },
          data: {
            stage: data.stage,
            group: data.group,
            kickoff: data.kickoff,
            homeTeam: data.homeTeam,
            awayTeam: data.awayTeam,
            homeFlag: data.homeFlag,
            awayFlag: data.awayFlag,
            venue: data.venue,
          },
        });
      } else {
        await prisma.match.update({ where: { id: existing.id }, data });
      }
      updated++;
    } else {
      await prisma.match.create({ data });
      created++;
    }
  }

  return { created, updated, total: fixtures.length };
}

function toDbShape(fx: NormalizedFixture) {
  return {
    externalId: fx.externalId,
    stage: fx.stage,
    group: fx.group,
    kickoff: fx.kickoff,
    homeTeam: fx.homeTeam,
    awayTeam: fx.awayTeam,
    homeFlag: fx.homeFlag,
    awayFlag: fx.awayFlag,
    homeScore: fx.homeScore,
    awayScore: fx.awayScore,
    venue: fx.venue,
    status: fx.status,
  };
}

/**
 * ¿Hay un partido en curso o que terminó hace menos de 4h?
 * Se usa para decidir si lock-and-score debe sincronizar con el proveedor
 * externo (sync inteligente — evita gastar requests en horas muertas).
 *
 * También devuelve true si hay matches GROUP con group=null — esto fuerza
 * un sync para que el ESPN provider las re-mapee usando lib/fifa2026.ts.
 */
async function hasMatchInWindow(): Promise<boolean> {
  const now = Date.now();
  const windowStart = new Date(now - 4 * 60 * 60 * 1000); // hace 4h
  const windowEnd = new Date(now + 30 * 60 * 1000); // dentro de 30min

  const [windowCount, missingGroupCount] = await Promise.all([
    prisma.match.count({
      where: {
        AND: [
          { kickoff: { gte: windowStart, lte: windowEnd } },
          { status: { not: 'CANCELLED' } },
          { OR: [{ scoredAt: null }, { status: 'LIVE' }] },
        ],
      },
    }),
    prisma.match.count({
      where: { stage: 'GROUP', group: null },
    }),
  ]);
  return windowCount > 0 || missingGroupCount > 0;
}

/**
 * Cierra pronósticos de partidos cuyo kickoff - offset ya pasó.
 * Calcula puntos de partidos FINISHED que aún no tengan scoredAt.
 * Si hay un partido en curso o reciente, hace sync con el proveedor antes
 * para tener los resultados frescos.
 */
export async function lockAndScore() {
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const offsetMs = (rules?.lockOffsetMin ?? 15) * 60_000;
  const pointsExact = rules?.pointsExact ?? 3;
  const pointsWinner = rules?.pointsWinner ?? 1;
  const now = Date.now();

  // 0bis. Push recordatorio 1h antes del kickoff. A users pagados que
  // NO hayan predicho. Marcamos reminderSentAt para no duplicar.
  // Ventana: entre kickoff-75min y kickoff-45min (el cron corre cada 10min
  // asi que cualquier partido caera en una de estas ejecuciones).
  const reminderWindowStart = new Date(now + 45 * 60_000);
  const reminderWindowEnd = new Date(now + 75 * 60_000);
  const toRemind = await prisma.match.findMany({
    where: {
      reminderSentAt: null,
      lockedAt: null,
      status: 'SCHEDULED',
      kickoff: { gte: reminderWindowStart, lte: reminderWindowEnd },
    },
    select: { id: true, homeTeam: true, awayTeam: true, kickoff: true },
  });
  for (const m of toRemind) {
    // Marca como enviado YA — race-safe vs duplicate crons
    const claim = await prisma.match.updateMany({
      where: { id: m.id, reminderSentAt: null },
      data: { reminderSentAt: new Date() },
    });
    if (claim.count === 0) continue; // otro cron ya lo agarro

    const usersNoPred = await prisma.user.findMany({
      where: {
        hasPaid: true,
        predictions: { none: { matchId: m.id } },
      },
      select: { id: true },
    });
    if (usersNoPred.length === 0) continue;

    const minsToKickoff = Math.max(
      1,
      Math.round((new Date(m.kickoff).getTime() - now) / 60_000),
    );
    await sendPushToUsers(usersNoPred.map((u) => u.id), () => ({
      title: `⚽ ${m.homeTeam} vs ${m.awayTeam}`,
      body: `Empieza en ${minsToKickoff} min y no has predicho. Última oportunidad.`,
      data: { type: 'match-reminder', matchId: m.id },
    })).catch((e) => console.error('[push] reminder notify:', e));
  }

  // 0. Sync inteligente: solo si hay partido cerca.
  let synced: false | Awaited<ReturnType<typeof syncMatchesFromApi>> = false;
  if (await hasMatchInWindow()) {
    try {
      synced = await syncMatchesFromApi();
    } catch (e) {
      console.error('[lock-and-score] sync provider fallo:', e instanceof Error ? e.message : e);
    }
  }

  // 0ter. Auto-unlock defensivo: si un partido SCHEDULED tiene lockedAt
  // pero su kickoff sigue siendo futuro (con margen del offset), es data
  // corrupta (un sync antiguo, un test, edición manual mala...). Lo limpiamos
  // antes de la fase de bloqueo. Solo afectaria a partidos que de todas formas
  // se volveran a bloquear en su momento correcto.
  const unlocked = await prisma.match.updateMany({
    where: {
      status: 'SCHEDULED',
      lockedAt: { not: null },
      kickoff: { gt: new Date(now + offsetMs) },
    },
    data: { lockedAt: null },
  });
  if (unlocked.count > 0) {
    console.warn(`[lock-and-score] auto-unlock corrigio ${unlocked.count} partido(s) mal bloqueado(s)`);
  }

  // 1. Bloqueo por hora
  const toLock = await prisma.match.findMany({
    where: { lockedAt: null, kickoff: { lte: new Date(now + offsetMs) } },
    select: { id: true, homeTeam: true, awayTeam: true },
  });
  if (toLock.length) {
    await prisma.match.updateMany({
      where: { id: { in: toLock.map((m) => m.id) } },
      data: { lockedAt: new Date() },
    });

    const autofill = rules?.autofillZeroOnLock ?? false;
    for (const m of toLock) {
      const usersNoPred = await prisma.user.findMany({
        where: {
          hasPaid: true,
          predictions: { none: { matchId: m.id } },
        },
        select: { id: true },
      });
      if (usersNoPred.length === 0) continue;

      if (autofill) {
        // Red de seguridad: crear 0-0 para los pagados sin predicción.
        await prisma.prediction.createMany({
          data: usersNoPred.map((u) => ({ userId: u.id, matchId: m.id, homeScore: 0, awayScore: 0 })),
          skipDuplicates: true,
        });
        // (No mandamos push de "no llegaste" porque ahora tienen 0-0.)
      } else {
        // Push: avisa a los que no llegaron a predecir.
        await sendPushToUsers(usersNoPred.map((u) => u.id), () => ({
          title: '⏰ Partido cerrado',
          body: `${m.homeTeam} vs ${m.awayTeam} — no llegaste a predecir esta vez.`,
          data: { type: 'match-locked', matchId: m.id },
        })).catch((e) => console.error('[push] locked notify:', e));
      }
    }
  }

  // 2. Cierre de pick de campeón
  if (rules?.tournamentStartAt && rules.tournamentStartAt.getTime() <= now) {
    await prisma.user.updateMany({
      where: { championLockedAt: null, championPick: { not: null } },
      data: { championLockedAt: new Date() },
    });
  } else {
    // Auto-unlock defensivo: el torneo NO ha empezado pero hay picks
    // congelados — pasó cuando tournamentStartAt estuvo mal puesto un día
    // antes y el cron congeló a todos. Los liberamos para que puedan cambiar
    // su campeón hasta el arranque real.
    const unlockedPicks = await prisma.user.updateMany({
      where: { championLockedAt: { not: null } },
      data: { championLockedAt: null },
    });
    if (unlockedPicks.count > 0) {
      console.warn(`[lock-and-score] auto-unlock libero ${unlockedPicks.count} pick(s) de campeon congelado(s) antes de tiempo`);
    }
  }

  // 3. Scoring — excluye matches marcados como excludeFromScoring (Liga
  // desactivada antes del Mundial, por ej.). Esos NO entran al ranking.
  const toScore = await prisma.match.findMany({
    where: {
      status: 'FINISHED',
      scoredAt: null,
      homeScore: { not: null },
      awayScore: { not: null },
      excludeFromScoring: false,
    },
    include: { predictions: true },
  });
  let scored = 0;
  const toNotify: Array<{ m: (typeof toScore)[number]; pointsByUser: Record<string, number> }> = [];
  for (const m of toScore) {
    const pointsByUser: Record<string, number> = {};
    for (const p of m.predictions) {
      const points = calcPoints(
        { homeScore: p.homeScore, awayScore: p.awayScore },
        { homeScore: m.homeScore!, awayScore: m.awayScore! },
        { pointsExact, pointsWinner },
      );
      await prisma.prediction.update({ where: { id: p.id }, data: { points } });
      pointsByUser[p.userId] = points;
      scored++;
    }
    await prisma.match.update({ where: { id: m.id }, data: { scoredAt: new Date() } });
    if (Object.keys(pointsByUser).length > 0) toNotify.push({ m, pointsByUser });
  }

  // Push: resultado personalizado + posición en el ranking. El ranking se
  // calcula UNA vez, ya con todos los puntos de este ciclo aplicados.
  if (toNotify.length > 0) {
    let posByUser = new Map<string, number>();
    try {
      const ranking = await computeRanking();
      posByUser = new Map(ranking.map((r, i) => [r.userId, i + 1]));
    } catch (e) {
      console.error('[push] ranking para notificacion fallo:', e);
    }
    for (const { m, pointsByUser } of toNotify) {
      await sendPushToUsers(Object.keys(pointsByUser), (uid) => {
        const pts = pointsByUser[uid];
        const ico = pts === 3 ? '🎯' : pts === 1 ? '👍' : '😬';
        const pos = posByUser.get(uid);
        const posTxt = pos ? ` Vas #${pos} en el ranking.` : '';
        return {
          title: `${ico} ${m.homeTeam} ${m.homeScore}–${m.awayScore} ${m.awayTeam}`,
          body:
            (pts === 3
              ? `¡Marcador exacto! Ganaste +${pts} pts.`
              : pts === 1
                ? `Acertaste el ganador. +${pts} pt.`
                : 'Esta no la sacaste. 0 pts.') + posTxt,
          data: { type: 'match-scored', matchId: m.id, points: pts },
        };
      }).catch((e) => console.error('[push] scored notify:', e));
    }
  }

  return { synced, locked: toLock.length, scored, scoredMatches: toScore.length };
}

/** Recalcula puntos de TODOS los partidos finalizados (admin manual). */
export async function recomputeAll() {
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const pointsExact = rules?.pointsExact ?? 3;
  const pointsWinner = rules?.pointsWinner ?? 1;

  const matches = await prisma.match.findMany({
    where: {
      status: 'FINISHED',
      homeScore: { not: null },
      awayScore: { not: null },
      excludeFromScoring: false,
    },
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
