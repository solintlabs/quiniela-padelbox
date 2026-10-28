import { prisma } from '@/lib/db';
import { requireTenantMemberApi } from '@/lib/saas/permissions';
import { computeCompetitionRanking } from '@/lib/saas/ranking';
import { publicDisplayName } from '@/lib/display';

/**
 * GET /api/saas/[tenant]/ranking?competitionId=... — clasificación.
 *
 * El nombre a mostrar se resuelve aquí: la membership puede traer uno propio
 * para ese club y, si no, se cae al del User enmascarando el email — igual
 * que hace PADELBOX, para no exponer la lista de correos de los socios.
 */
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantMemberApi(params.tenant, req);
  if (ctx instanceof Response) return ctx;

  const competitionId = new URL(req.url).searchParams.get('competitionId');
  if (!competitionId) {
    return Response.json({ error: 'Falta competitionId.' }, { status: 400 });
  }

  const rows = await computeCompetitionRanking(ctx.tenant.id, competitionId);
  if (rows.length === 0) return Response.json({ ranking: [] });

  // Un solo viaje a User para todos los que no tienen displayName propio.
  const needsName = rows.filter((r) => !r.displayName).map((r) => r.userId);
  const users = needsName.length
    ? await prisma.user.findMany({
        where: { id: { in: needsName } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const byUserId = new Map(users.map((u) => [u.id, u]));

  const ranking = rows.map((row) => {
    if (row.displayName) return row;
    const user = byUserId.get(row.userId);
    return {
      ...row,
      displayName: user
        ? publicDisplayName({ name: user.name, email: user.email })
        : 'Jugador',
    };
  });

  return Response.json({ ranking });
}
