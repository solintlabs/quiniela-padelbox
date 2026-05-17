import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';

/**
 * Devuelve los pronósticos de un usuario que ya están "públicos":
 * partidos cerrados (lockedAt) o finalizados. Los pronósticos
 * de partidos aún abiertos quedan ocultos (anti-trampa).
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUserApi(req);
  if (me instanceof Response) return me;

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, createdAt: true, hasPaid: true,
      championPick: true, championLockedAt: true,
    },
  });
  if (!target) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const offsetMs = (rules?.lockOffsetMin ?? 15) * 60_000;
  const lockedTimeThreshold = new Date(Date.now() + offsetMs);

  // Solo predicciones de partidos ya cerrados (por lockedAt o por hora)
  const predictions = await prisma.prediction.findMany({
    where: {
      userId: target.id,
      OR: [
        { match: { lockedAt: { not: null } } },
        { match: { status: { not: 'SCHEDULED' } } },
        { match: { kickoff: { lte: lockedTimeThreshold } } },
      ],
    },
    include: { match: true },
    orderBy: { match: { kickoff: 'asc' } },
  });

  // Stats globales (pronósticos secretos también cuentan para el total)
  const totalPredictions = await prisma.prediction.count({
    where: { userId: target.id },
  });
  const totalPoints = await prisma.prediction.aggregate({
    where: { userId: target.id, points: { not: null } },
    _sum: { points: true },
  });
  const exact = await prisma.prediction.count({
    where: { userId: target.id, points: 3 },
  });

  return NextResponse.json({
    user: {
      id: target.id,
      name: target.name,
      email: target.email,
      hasPaid: target.hasPaid,
      createdAt: target.createdAt,
      championPick: target.championPick,
      championLockedAt: target.championLockedAt,
    },
    isMe: target.id === me.id,
    stats: {
      total: totalPredictions,
      points: totalPoints._sum.points ?? 0,
      exact,
    },
    predictions,
    hiddenCount: totalPredictions - predictions.length,
  });
}
