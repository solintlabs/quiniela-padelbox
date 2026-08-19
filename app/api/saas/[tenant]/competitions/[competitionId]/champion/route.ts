import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { hasAtLeastRole } from '@/lib/saas/roles';

/**
 * POST /api/saas/[tenant]/competitions/[competitionId]/champion
 *
 * El jugador elige su campeón del torneo. Se congela cuando arranca el primer
 * partido de la competición (igual que el pick de PADELBOX al primer pitido).
 * Si acierta y el organizador fija ese equipo como ganador, suma pointsBonus.
 */
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ teamId: z.string().min(1) });

export async function POST(
  req: Request,
  { params }: { params: { tenant: string; competitionId: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'PLAYER', req);
  if (ctx instanceof Response) return ctx;

  // Mismo criterio que los pronósticos: con cuota, solo pagados (o el
  // organizador); sin cuota ("por diversión"), todos.
  if (
    ctx.tenant.entryFee &&
    !ctx.membership.hasPaid &&
    !hasAtLeastRole(ctx.membership.role, 'ADMIN')
  ) {
    return Response.json(
      { error: 'Tu inscripción está pendiente de confirmar.' },
      { status: 403 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  const competition = await prisma.saasCompetition.findFirst({
    where: { id: params.competitionId, tenantId: ctx.tenant.id },
    select: { id: true },
  });
  if (!competition) {
    return Response.json({ error: 'Competición no encontrada.' }, { status: 404 });
  }

  // El equipo debe ser de esta competición.
  const team = await prisma.saasTeam.findFirst({
    where: { id: parsed.data.teamId, competitionId: competition.id },
    select: { id: true },
  });
  if (!team) {
    return Response.json({ error: 'Ese equipo no es de esta competición.' }, { status: 400 });
  }

  // El pick se congela al arrancar el primer partido.
  const first = await prisma.saasFixture.findFirst({
    where: { competitionId: competition.id },
    orderBy: { kickoff: 'asc' },
    select: { kickoff: true },
  });
  if (first && first.kickoff.getTime() <= Date.now()) {
    return Response.json(
      { error: 'El pick de campeón ya está cerrado (el torneo ha empezado).' },
      { status: 409 },
    );
  }

  await prisma.saasChampionPick.upsert({
    where: {
      membershipId_competitionId: {
        membershipId: ctx.membership.id,
        competitionId: competition.id,
      },
    },
    create: {
      membershipId: ctx.membership.id,
      competitionId: competition.id,
      teamId: team.id,
    },
    update: { teamId: team.id },
  });

  return Response.json({ ok: true });
}
