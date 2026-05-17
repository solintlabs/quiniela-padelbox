import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';

export async function GET(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, email: true, name: true, image: true, role: true,
      hasPaid: true, paidAt: true, championPick: true, championLockedAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ me });
}

const patchSchema = z.object({
  championPick: z.string().trim().min(1).max(60).nullable(),
});

export async function PATCH(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  // Si el pick ya está congelado, no permitir cambios.
  const cur = await prisma.user.findUnique({
    where: { id: user.id },
    select: { championLockedAt: true },
  });
  if (cur?.championLockedAt) {
    return NextResponse.json(
      { error: 'Tu pick de campeón ya está congelado al inicio del torneo' },
      { status: 403 },
    );
  }

  const me = await prisma.user.update({
    where: { id: user.id },
    data: { championPick: parsed.data.championPick },
    select: {
      id: true, email: true, name: true, role: true,
      hasPaid: true, championPick: true, championLockedAt: true,
    },
  });
  return NextResponse.json({ me });
}
