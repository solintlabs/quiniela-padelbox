import { requireUserApi } from '@/lib/permissions';
import { requireSaasEnabled } from '@/lib/saas/flags';
import { resolveTenant } from '@/lib/saas/tenant';
import { joinTenantAsPlayer, PlanLimitError } from '@/lib/saas/tenants';

/**
 * POST /api/saas/[tenant]/join — apuntarse a la quiniela de un comercio.
 *
 * El "link de invitación" es simplemente /saas/[tenant]/unirse. No hay token:
 * entrar no da acceso a nada útil hasta que el organizador confirma la
 * inscripción (membership.hasPaid), igual que ya funciona PADELBOX. Un token
 * añadiría un secreto que gestionar sin cerrar ninguna puerta real.
 */
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const off = requireSaasEnabled();
  if (off) return off;

  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const tenant = await resolveTenant(params.tenant);
  if (!tenant) return Response.json({ error: 'No encontrado' }, { status: 404 });

  try {
    const membership = await joinTenantAsPlayer(tenant.id, user.id);
    return Response.json({
      ok: true,
      role: membership.role,
      hasPaid: membership.hasPaid,
      url: `/saas/${tenant.slug}`,
    });
  } catch (e) {
    if (e instanceof PlanLimitError) {
      // 402: el problema no es del jugador, es que el organizador necesita
      // ampliar plan. El mensaje se le enseña tal cual.
      return Response.json({ error: e.message, reason: e.reason }, { status: 402 });
    }
    console.error('[saas/join] fallo:', e);
    return Response.json({ error: 'No se pudo completar la inscripción.' }, { status: 500 });
  }
}
