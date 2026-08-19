import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';

/**
 * PATCH /api/saas/[tenant]/competitions/[competitionId]
 *
 * El organizador (ADMIN) edita las reglas de puntuación, el margen de cierre y
 * el estado (abrir/cerrar) de su competición. Lo que la wizard prometía "puedes
 * cambiarlo desde tu panel".
 */
export const dynamic = 'force-dynamic';

const pts = z.number().int().min(0).max(100);
const patchSchema = z.object({
  pointsExact: pts.optional(),
  pointsWinner: pts.optional(),
  pointsGoalDiff: pts.optional(),
  pointsTeamScore: pts.optional(),
  pointsDrawBonus: pts.optional(),
  // Bonus por acertar el campeón del torneo (equivalente al +25 de PADELBOX).
  pointsBonus: pts.optional(),
  lockOffsetMin: z.number().int().min(0).max(1440).optional(),
  // Tendencia 1X2 visible antes del cierre (solo %; los marcadores, nunca).
  showTrendPreClose: z.boolean().optional(),
  status: z.enum(['DRAFT', 'OPEN', 'LOCKED', 'FINISHED']).optional(),
  // Equipo campeón: id de un SaasTeam de esta competición, o null para limpiar.
  championWinnerTeamId: z.string().min(1).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { tenant: string; competitionId: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  const target = await prisma.saasCompetition.findFirst({
    where: { id: params.competitionId, tenantId: ctx.tenant.id },
    select: { id: true },
  });
  if (!target) return Response.json({ error: 'Competición no encontrada.' }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 },
    );
  }

  // El equipo campeón debe pertenecer a esta competición (o ser null para limpiar).
  if (parsed.data.championWinnerTeamId) {
    const team = await prisma.saasTeam.findFirst({
      where: { id: parsed.data.championWinnerTeamId, competitionId: target.id },
      select: { id: true },
    });
    if (!team) {
      return Response.json({ error: 'Ese equipo no es de esta competición.' }, { status: 400 });
    }
  }

  const updated = await prisma.saasCompetition.update({
    where: { id: target.id },
    data: parsed.data,
    select: {
      id: true,
      status: true,
      pointsExact: true,
      pointsWinner: true,
      pointsGoalDiff: true,
      pointsTeamScore: true,
      pointsDrawBonus: true,
      pointsBonus: true,
      lockOffsetMin: true,
      showTrendPreClose: true,
      championWinnerTeamId: true,
    },
  });

  return Response.json({ ok: true, competition: updated });
}
