import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePaidApi } from '@/lib/permissions';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

const ItemSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
});

const Schema = z.object({
  predictions: z.array(ItemSchema).min(1).max(120), // tope sano (mundial = 104)
});

/**
 * POST /api/predictions/batch
 *
 * Guarda muchos pronósticos en una sola request. Útil para la vista
 * "Rellenar fase de grupos" donde el usuario envía los 48 de golpe.
 *
 * Comportamiento por elemento:
 * - Si el partido no existe → se omite con error.
 * - Si el partido está cerrado → se omite con error.
 * - Si pasa todo → upsert (crea o actualiza la predicción del usuario).
 *
 * Devuelve { saved, skipped: [{matchId, reason}] } para que el cliente
 * sepa qué pronósticos NO se guardaron (porque cerraron mientras escribía).
 */
export async function POST(req: Request) {
  const user = await requirePaidApi(req);
  if (user instanceof Response) return user;

  // Rate limit: max 20 batches por minuto por user (cada batch ya guarda
  // hasta 120 predicciones, asi que es generoso para uso normal).
  const rl = await rateLimit(`predict-batch:user:${user.id}`, 20, 60);
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', issues: parsed.error.format() }, { status: 400 });
  }

  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const offsetMs = (rules?.lockOffsetMin ?? 15) * 60_000;
  const now = Date.now();

  const matchIds = parsed.data.predictions.map((p) => p.matchId);
  const matches = await prisma.match.findMany({
    where: { id: { in: matchIds } },
    select: { id: true, kickoff: true, lockedAt: true, status: true },
  });
  const matchById = new Map(matches.map((m) => [m.id, m]));

  let saved = 0;
  const skipped: Array<{ matchId: string; reason: string }> = [];

  for (const p of parsed.data.predictions) {
    const m = matchById.get(p.matchId);
    if (!m) {
      skipped.push({ matchId: p.matchId, reason: 'no_existe' });
      continue;
    }
    const lockedByTime = new Date(m.kickoff).getTime() - offsetMs <= now;
    if (m.lockedAt || lockedByTime || m.status !== 'SCHEDULED') {
      skipped.push({ matchId: p.matchId, reason: 'cerrado' });
      continue;
    }
    await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId: p.matchId } },
      update: { homeScore: p.homeScore, awayScore: p.awayScore },
      create: {
        userId: user.id,
        matchId: p.matchId,
        homeScore: p.homeScore,
        awayScore: p.awayScore,
      },
    });
    saved++;
  }

  return NextResponse.json({ saved, skipped });
}
