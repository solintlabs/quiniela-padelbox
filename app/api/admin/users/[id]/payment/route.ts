import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminApi } from '@/lib/permissions';

const Schema = z.object({
  hasPaid: z.boolean(),
  paidNote: z.string().max(200).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAdminApi();
  if (user instanceof Response) return user;
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const target = await prisma.user.update({
    where: { id: params.id },
    data: {
      hasPaid: parsed.data.hasPaid,
      paidAt: parsed.data.hasPaid ? new Date() : null,
      paidNote: parsed.data.paidNote ?? null,
    },
  });
  return NextResponse.json({ user: target });
}
