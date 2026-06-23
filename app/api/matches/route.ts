import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';

export async function GET(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  // Modo ligero (?light=1): la app lo usa para el auto-refresco en vivo cada
  // par de minutos. Devuelve marcador/estado + la prediccion del user, pero
  // NO calcula la distribucion (que es lo caro y no cambia en partidos ya
  // cerrados). Ahorra CPU de Vercel en el endpoint mas sondeado.
  const light = new URL(req.url).searchParams.get('light') === '1';

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

  // En modo ligero devolvemos ya, sin distribucion (el auto-refresco en vivo
  // solo necesita marcador/estado actualizado).
  if (light) {
    return NextResponse.json({ matches: matches.map((m) => ({ ...m, distribution: null })) });
  }

  // Distribución agregada (% local/empate/visitante) por match. No expone
  // marcadores individuales ni numero total. Se muestra desde la 1a prediccion.
  // El admin puede desactivarla globalmente desde /admin/reglas.
  const rules = await prisma.rules.findUnique({
    where: { id: 1 },
    select: { showDistribution: true },
  });
  const showDistribution = rules?.showDistribution ?? true;
  const MIN_PREDS_FOR_DIST = 1;
  const allPreds = showDistribution
    ? await prisma.prediction.findMany({
        where: { matchId: { in: matches.map((m) => m.id) } },
        select: { matchId: true, homeScore: true, awayScore: true },
      })
    : [];
  const distByMatch = new Map<string, { h: number; d: number; a: number; total: number }>();
  for (const p of allPreds) {
    const cur = distByMatch.get(p.matchId) ?? { h: 0, d: 0, a: 0, total: 0 };
    if (p.homeScore > p.awayScore) cur.h += 1;
    else if (p.homeScore === p.awayScore) cur.d += 1;
    else cur.a += 1;
    cur.total += 1;
    distByMatch.set(p.matchId, cur);
  }

  const withDist = matches.map((m) => {
    const raw = distByMatch.get(m.id);
    const distribution =
      raw && raw.total >= MIN_PREDS_FOR_DIST
        ? {
            homePct: Math.round((raw.h / raw.total) * 100),
            drawPct: Math.round((raw.d / raw.total) * 100),
            awayPct: Math.round((raw.a / raw.total) * 100),
          }
        : null;
    return { ...m, distribution };
  });

  return NextResponse.json({ matches: withDist });
}
