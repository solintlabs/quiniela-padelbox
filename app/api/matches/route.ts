import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';

export async function GET() {
  const user = await requireUserApi();
  if (user instanceof Response) return user;

  const matches = await prisma.match.findMany({
    orderBy: { kickoff: 'asc' },
    include: {
      predictions: {
        where: { userId: user.id },
        select: { homeScore: true, awayScore: true, points: true },
      },
    },
  });
  return NextResponse.json({ matches });
}
