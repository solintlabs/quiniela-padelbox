import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { importCompetitionFixtures, initialImportWindow } from '@/lib/saas/sync';
import { lockDueFixtures, scoreCompetition } from '@/lib/saas/scoring';

/**
 * POST /api/saas/[tenant]/competitions/[competitionId]/sync
 *
 * Acción manual del organizador (OWNER): importa partidos/resultados de ESPN,
 * cierra los que toca y puntúa los finalizados. Lo mismo que hace el cron, pero
 * a demanda — para no esperar a la próxima pasada al probar.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: { tenant: string; competitionId: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'OWNER', req);
  if (ctx instanceof Response) return ctx;

  const competition = await prisma.saasCompetition.findFirst({
    where: { id: params.competitionId, tenantId: ctx.tenant.id },
    select: { id: true, lockOffsetMin: true, provider: true },
  });
  if (!competition) {
    return Response.json({ error: 'Competición no encontrada.' }, { status: 404 });
  }

  let imported = null;
  if (competition.provider === 'ESPN') {
    // Ventana amplia: el organizador pulsa esto justamente cuando NO ve
    // partidos (liga en descanso, calendario recién publicado).
    imported = await importCompetitionFixtures(competition.id, initialImportWindow(new Date()));
  }
  const locked = await lockDueFixtures(competition);
  const { entriesScored } = await scoreCompetition(competition.id);

  return Response.json({ ok: true, imported, locked, scored: entriesScored });
}
