import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminApi } from '@/lib/permissions';

const Schema = z.object({
  pointsExact: z.number().int().min(0).max(100).optional(),
  pointsWinner: z.number().int().min(0).max(100).optional(),
  pointsChampion: z.number().int().min(0).max(1000).optional(),
  lockOffsetMin: z.number().int().min(0).max(1440).optional(),
  tournamentStartAt: z.string().datetime().nullable().optional(),
});

export async function POST(req: Request) {
  const user = await requireAdminApi();
  if (user instanceof Response) return user;
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const data = {
    ...parsed.data,
    tournamentStartAt:
      parsed.data.tournamentStartAt === undefined
        ? undefined
        : parsed.data.tournamentStartAt === null
          ? null
          : new Date(parsed.data.tournamentStartAt),
  };
  const rules = await prisma.rules.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  return NextResponse.json({ rules });
}
