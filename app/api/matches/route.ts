import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';

export async function GET(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const matches = await prisma.match.findMany({
    // Ocultar matches de competiciones desactivadas (excludeFromScoring=true).
    // La app movil consume este endpoint para listar Mundial / Liga; si una
    // competicion entera esta desactivada, sus matches no deben aparecer.
    where: { excludeFromScoring: false },
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
