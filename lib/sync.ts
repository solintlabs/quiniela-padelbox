import { Prisma } from '@prisma/client';
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
  const rules = await prisma.rules.findUnique({ where: { id: 1 }, select: { syncPaused: true } });
  if (rules?.syncPaused) {
    return { created: 0, updated: 0, total: 0, paused: true as const };
  }

  const fixtures = await fetchWorldCupFixtures();
  if (fixtures.length === 0) return { created: 0, updated: 0, total: 0 };

  // UNA sola lectura de todos los matches por externalId (antes: 1 findUnique
  // por fixture = N+1, ~100 queries cada sync). Reduce drasticamente el tiempo
  // de computo de Neon (factura por tiempo activo).
  const existingAll = await prisma.match.findMany({
    where: { externalId: { in: fixtures.map((f) => f.externalId) } },
  });
  const byExt = new Map(existingAll.map((m) => [m.externalId, m]));

  const ops: Prisma.PrismaPromise<unknown>[] = [];
  let created = 0;
  let updated = 0;

  for (const fx of fixtures) {
    const data = toDbShape(fx);
    const existing = byExt.get(data.externalId);
    if (!existing) {
      ops.push(prisma.match.create({ data }));
      created++;
      continue;
    }

    // Qué campos tocaría este match segun su estado.
    let patch: Partial<typeof data>;
    if (existing.status === 'FINISHED' && existing.scoredAt && data.status !== 'FINISHED') {
      // Ya terminado Y puntuado: no degradar por status transitorio de ESPN.
      patch = {
        stage: data.stage,
        group: data.group,
        homeFlag: data.homeFlag,
        awayFlag: data.awayFlag,
        venue: data.venue,
      };
    } else if (existing.manualResult) {
      // Resultado fijado a mano: no tocar marcador/estado.
      patch = {
        stage: data.stage,
        group: data.group,
        kickoff: data.kickoff,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        homeFlag: data.homeFlag,
        awayFlag: data.awayFlag,
        venue: data.venue,
      };
    } else {
      patch = data;
    }

    // CLAVE: solo escribir si ALGO cambió. En horas muertas ESPN devuelve
    // datos identicos -> 0 writes (antes: 100 updates inutiles cada 5 min).
    const changed = changedFields(existing, patch);
    if (Object.keys(changed).length > 0) {
      ops.push(prisma.match.update({ where: { id: existing.id }, data: changed }));
      updated++;
    }
  }

  if (ops.length > 0) await prisma.$transaction(ops);
  return { created, updated, total: fixtures.length };
}

/** Devuelve solo los campos de `patch` cuyo valor difiere del registro actual. */
function changedFields<T extends Record<string, unknown>>(
  existing: Record<string, unknown>,
  patch: T,
): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(patch)) {
    const cur = existing[k];
    const equal =
      v instanceof Date && cur instanceof Date ? v.getTime() === cur.getTime() : cur === v;
    if (!equal) out[k as keyof T] = v as T[keyof T];
  }
  return out;
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
export async function hasMatchInWindow(): Promise<boolean> {
  const now = Date.now();
  const windowStart = new Date(now - 4 * 60 * 60 * 1000); // hace 4h
  // +90min: cubre el recordatorio "1h antes" (ventana 45-75min) para que el
  // cron este en cadencia rapida cuando toca avisar, no solo en el kickoff.
  const windowEnd = new Date(now + 90 * 60 * 1000);

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

  // SALIDA RAPIDA si no hay nada cerca (ahorra CPU Vercel en horas muertas).
  // Si no hay partido en la ventana [-4h, +90min] entonces: no hay
  // recordatorios (van en +45-75min), ni "ultima llamada" (en +2-9min al
  // cierre), ni cierres (kickoff-15 de un partido a >90min esta lejos), ni
  // partidos FINISHED sin puntuar (caerian dentro de -4h). Nada que hacer.
  const inWindow = await hasMatchInWindow();
  if (!inWindow) {
    return { synced: false as const, locked: 0, scored: 0, scoredMatches: 0, idle: true };
  }

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
      body: `Empieza en ${minsToKickoff} min y no has predicho. ¡No te lo pierdas!`,
      data: { type: 'match-reminder', matchId: m.id },
    })).catch((e) => console.error('[push] reminder notify:', e));
  }

  // 0ter. Push "última llamada": pocos minutos ANTES de que se cierre el
  // pronóstico. El cierre es kickoff - lockOffsetMin (15 por defecto), así que
  // avisamos cuando faltan 2-9 min para ese cierre (≈ 17-24 min del kickoff).
  // A pagados que aún NO han predicho. Marca lastCallSentAt para no duplicar.
  const lockSoonStart = new Date(now + 2 * 60_000); // el cierre ocurre en >=2min
  const lockSoonEnd = new Date(now + 9 * 60_000); // ...y en <=9min
  const toLastCall = await prisma.match.findMany({
    where: {
      lastCallSentAt: null,
      lockedAt: null,
      status: 'SCHEDULED',
      // kickoff - offset (= momento de cierre) cae en la ventana [+2min, +9min]
      kickoff: {
        gte: new Date(lockSoonStart.getTime() + offsetMs),
        lte: new Date(lockSoonEnd.getTime() + offsetMs),
      },
    },
    select: { id: true, homeTeam: true, awayTeam: true, kickoff: true },
  });
  for (const m of toLastCall) {
    const claim = await prisma.match.updateMany({
      where: { id: m.id, lastCallSentAt: null },
      data: { lastCallSentAt: new Date() },
    });
    if (claim.count === 0) continue;

    const usersNoPred = await prisma.user.findMany({
      where: { hasPaid: true, predictions: { none: { matchId: m.id } } },
      select: { id: true },
    });
    if (usersNoPred.length === 0) continue;

    const minsToClose = Math.max(
      1,
      Math.round((new Date(m.kickoff).getTime() - offsetMs - now) / 60_000),
    );
    const autofillOn = rules?.autofillZeroOnLock ?? false;
    await sendPushToUsers(usersNoPred.map((u) => u.id), () => ({
      title: `⏳ Cierra en ${minsToClose} min — ${m.homeTeam} vs ${m.awayTeam}`,
      body: autofillOn
        ? `Aún no has pronosticado. Si no lo haces, quedará 0-0. ¡Entra y ponlo!`
        : `Última oportunidad para enviar tu pronóstico antes del cierre.`,
      data: { type: 'match-lastcall', matchId: m.id },
    })).catch((e) => console.error('[push] lastcall notify:', e));
  }

  // 0. Sync con el proveedor: aqui ya sabemos que hay partido en ventana
  // (si no, habriamos salido arriba), asi que siempre sincronizamos.
  let synced: false | Awaited<ReturnType<typeof syncMatchesFromApi>> = false;
  try {
    synced = await syncMatchesFromApi();
  } catch (e) {
    console.error('[lock-and-score] sync provider fallo:', e instanceof Error ? e.message : e);
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

  // idle = no hay partido cerca/en vivo/reciente-sin-puntuar. El cron externo
  // lee esto para espaciar sus pings (deja que Neon se suspenda y no gastar
  // horas de computo en horas muertas).
  // Si llegamos aqui, habia partido en ventana -> no idle.
  return { synced, locked: toLock.length, scored, scoredMatches: toScore.length, idle: false };
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
