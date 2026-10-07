import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { recomputeCompetition } from '@/lib/saas/scoring';

/**
 * POST /api/saas/[tenant]/competitions/[competitionId]/recompute
 *
 * Recalcula TODOS los puntos de la competición desde cero. Es lo que el
 * organizador necesita tras cambiar las reglas de puntuación o corregir un
 * marcador: sin esto los puntos viejos se quedaban como estaban.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: { tenant: string; competitionId: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  const comp = await prisma.saasCompetition.findFirst({
    where: { id: params.competitionId, tenantId: ctx.tenant.id },
    select: { id: true },
  });
  if (!comp) return Response.json({ error: 'Competición no encontrada.' }, { status: 404 });

  const result = await recomputeCompetition(comp.id);
  return Response.json({ ok: true, ...result });
}
