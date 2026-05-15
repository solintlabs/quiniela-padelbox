import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';

export async function GET(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    include: { match: true },
    orderBy: { match: { kickoff: 'asc' } },
  });
  return NextResponse.json({ predictions });
}
