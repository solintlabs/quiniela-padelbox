import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { isBillingConfigured } from '@/lib/saas/billing';
import { stripe } from '@/lib/saas/stripe';

/**
 * POST /api/saas/[tenant]/billing/portal
 *
 * Abre el Customer Portal de Stripe para que el OWNER gestione o CANCELE su
 * suscripción Pro. La cancelación la procesa Stripe; el webhook
 * (customer.subscription.deleted) baja el tenant a FREE al terminar el periodo.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'OWNER', req);
  if (ctx instanceof Response) return ctx;

  if (!isBillingConfigured()) {
    return Response.json({ error: 'Los pagos no están disponibles ahora mismo.' }, { status: 503 });
  }

  const { tenant } = ctx;
  if (!tenant.stripeCustomerId) {
    return Response.json(
      { error: 'Esta quiniela todavía no tiene una suscripción activa.' },
      { status: 400 },
    );
  }

  try {
    const origin = new URL(req.url).origin;
    const session = await stripe().billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${origin}/saas/${tenant.slug}/panel`,
    });
    return Response.json({ url: session.url });
  } catch (e) {
    // El portal exige configurarse una vez en Stripe (Settings → Billing →
    // Customer portal). Si falta, devolvemos el motivo real en vez de un 500.
    const msg = e instanceof Error ? e.message : 'Error de Stripe';
    console.error('[billing/portal]', msg);
    return Response.json({ error: `Stripe: ${msg}` }, { status: 502 });
  }
}
