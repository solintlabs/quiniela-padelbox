import { NextResponse } from 'next/server';
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
