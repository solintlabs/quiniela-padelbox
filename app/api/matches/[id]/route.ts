import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      predictions: {
        where: { userId: user.id },
        select: { homeScore: true, awayScore: true, points: true },
      },
    },
  });
  if (!match) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ match });
}
