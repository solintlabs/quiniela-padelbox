import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePaidApi } from '@/lib/permissions';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

export const maxDuration = 20;

const Schema = z.object({
  matchId: z.string().min(1),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
});

export async function POST(req: Request) {
  const user = await requirePaidApi(req);
  if (user instanceof Response) return user;

  // Rate limit: max 60 predicciones por minuto por usuario.
  // Margen amplio para uso normal (incluso editando varias), pero corta
  // bots / scripts que martillan el endpoint.
  const rl = await rateLimit(`predict:user:${user.id}`, 60, 60);
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', issues: parsed.error.format() }, { status: 400 });
  }

  const { matchId, homeScore, awayScore } = parsed.data;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });

  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const offsetMin = rules?.lockOffsetMin ?? 15;
  const lockedByTime = new Date(match.kickoff).getTime() - offsetMin * 60_000 <= Date.now();
  if (match.lockedAt || lockedByTime || match.status !== 'SCHEDULED') {
    return NextResponse.json(
      { error: 'cerrado', message: 'Este partido ya no admite cambios.' },
      { status: 409 },
    );
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId } },
    update: { homeScore, awayScore },
    create: { userId: user.id, matchId, homeScore, awayScore },
  });

  return NextResponse.json({ prediction });
}
