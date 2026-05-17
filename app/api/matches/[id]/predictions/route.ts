import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';
import { publicDisplayName } from '@/lib/display';

/**
 * Lista los pronósticos de TODOS los usuarios para un partido concreto.
 * Solo se devuelven si el partido está cerrado — antes son privados para
 * evitar trampas (un usuario copiando el pick de otro antes del kickoff).
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      kickoff: true,
      lockedAt: true,
      status: true,
      homeTeam: true,
      awayTeam: true,
      homeScore: true,
      awayScore: true,
    },
  });
  if (!match) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const offsetMs = (rules?.lockOffsetMin ?? 15) * 60_000;
  const lockedByTime = new Date(match.kickoff).getTime() - offsetMs <= Date.now();
  const isLocked = !!match.lockedAt || match.status !== 'SCHEDULED' || lockedByTime;

  if (!isLocked) {
    return NextResponse.json(
      { error: 'No disponible', message: 'Los pronósticos de los demás se ven una vez se cierre el partido.' },
      { status: 403 },
    );
  }

  const predictions = await prisma.prediction.findMany({
    where: { matchId: match.id },
    select: {
      id: true,
      homeScore: true,
      awayScore: true,
      points: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ points: 'desc' }, { createdAt: 'asc' }],
  });

  // ===== Agregados para "comparativa" =====
  let homeWins = 0, draws = 0, awayWins = 0;
  const scoreCount = new Map<string, number>();
  for (const p of predictions) {
    if (p.homeScore > p.awayScore) homeWins++;
    else if (p.homeScore < p.awayScore) awayWins++;
    else draws++;
    const key = `${p.homeScore}-${p.awayScore}`;
    scoreCount.set(key, (scoreCount.get(key) ?? 0) + 1);
  }
  const total = predictions.length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  // Top 3 marcadores más predichos
  const topScores = [...scoreCount.entries()]
    .map(([score, count]) => {
      const [h, a] = score.split('-').map(Number);
      return { homeScore: h, awayScore: a, count, pct: pct(count) };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return NextResponse.json({
    match,
    predictions: predictions.map((p) => {
      const isMe = p.user.id === user.id;
      return {
        id: p.id,
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        points: p.points,
        user: {
          id: p.user.id,
          name: p.user.name,
          // Email real solo si es uno mismo. Resto: mascarado para anti-scraping.
          email: isMe
            ? p.user.email
            : publicDisplayName({ name: p.user.name, email: p.user.email }),
        },
        isMe,
      };
    }),
    stats: {
      total,
      homeWins,
      draws,
      awayWins,
      pctHome: pct(homeWins),
      pctDraw: pct(draws),
      pctAway: pct(awayWins),
      topScores,
    },
  });
}
