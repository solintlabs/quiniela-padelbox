import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rules — público.
 * Devuelve la configuración global de la quiniela (cuota, sistema de puntos,
 * offset de cierre, fecha de inicio). La app móvil lo usa para mostrar el
 * precio de la inscripción siempre actualizado.
 */
export async function GET() {
  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    rules: {
      feeAmount: rules?.feeAmount ?? 10,
      feeCurrency: rules?.feeCurrency ?? 'USD',
      pointsExact: rules?.pointsExact ?? 3,
      pointsWinner: rules?.pointsWinner ?? 1,
      pointsChampion: rules?.pointsChampion ?? 25,
      lockOffsetMin: rules?.lockOffsetMin ?? 15,
      tournamentStartAt: rules?.tournamentStartAt ?? null,
      syncPaused: rules?.syncPaused ?? false,
      weeklyPrizesText: rules?.weeklyPrizesText ?? null,
      championPrizesText: rules?.championPrizesText ?? null,
    },
  });
}
