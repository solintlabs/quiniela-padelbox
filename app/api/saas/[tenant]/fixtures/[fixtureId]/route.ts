import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { scoreCompetition } from '@/lib/saas/scoring';

/**
 * PATCH /api/saas/[tenant]/fixtures/[fixtureId]
 *
 * El organizador (ADMIN) fija o corrige el resultado de un partido a mano —
 * igual que el admin de PADELBOX edita marcadores. Marca el partido FINISHED,
 * lo bloquea, y marca manualResult para que el sync de ESPN no lo pise. Luego
 * recalcula los puntos de la competición al instante.
 */
export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  homeScore: z.number().int().min(0).max(50),
  awayScore: z.number().int().min(0).max(50),
});

export async function PATCH(
  req: Request,
  { params }: { params: { tenant: string; fixtureId: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  const fixture = await prisma.saasFixture.findFirst({
    where: { id: params.fixtureId, competition: { tenantId: ctx.tenant.id } },
    select: { id: true, competitionId: true },
  });
  if (!fixture) return Response.json({ error: 'Partido no encontrado.' }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 },
    );
  }

  await prisma.saasFixture.update({
    where: { id: fixture.id },
    data: {
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      status: 'FINISHED',
      manualResult: true,
      lockedAt: new Date(),
    },
  });

  const { entriesScored } = await scoreCompetition(fixture.competitionId);
  return Response.json({ ok: true, scored: entriesScored });
}
