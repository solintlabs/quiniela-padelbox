import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { isBillingConfigured } from '@/lib/saas/billing';
import { stripe, proPriceId, seasonPriceId } from '@/lib/saas/stripe';

/**
 * POST /api/saas/[tenant]/billing/checkout
 *
 * Crea la Checkout Session del plan Pro para el organizador y devuelve la URL
 * a la que redirigir. Solo el OWNER del tenant (quien lo creó) puede pagar —
 * un ADMIN invitado no toca facturación.
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

  try {
    // Reusa el cliente de Stripe del tenant o créalo la primera vez.
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: tenant.adminEmail,
        name: tenant.name,
        metadata: { tenantId: tenant.id, slug: tenant.slug },
      });
      customerId = customer.id;
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // ?plan=season → pago único por temporada; por defecto, suscripción mensual.
    const url = new URL(req.url);
    const season = url.searchParams.get('plan') === 'season';
    const price = season ? seasonPriceId() : proPriceId();

    const origin = url.origin;
    const session = await stripe().checkout.sessions.create({
      mode: season ? 'payment' : 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      client_reference_id: tenant.id,
      // La metadata del tenant tiene que viajar en el objeto que llega al
      // webhook: en pago único no hay subscription_data.
      metadata: { tenantId: tenant.id, kind: season ? 'season' : 'monthly' },
      ...(season ? {} : { subscription_data: { metadata: { tenantId: tenant.id } } }),
      // Permite cupones (p. ej. el 100% para la compra de verificación).
      allow_promotion_codes: true,
      // Managed Payments viene activado por defecto en esta cuenta y exige un
      // tax_code en el producto; lo desactivamos por request para no bloquear
      // el checkout (nosotros no gestionamos impuestos automáticos).
      managed_payments: { enabled: false },
      success_url: `${origin}/saas/${tenant.slug}/panel?upgraded=1`,
      cancel_url: `${origin}/saas/${tenant.slug}/panel`,
    } as Stripe.Checkout.SessionCreateParams);

    return Response.json({ url: session.url });
  } catch (e) {
    // Devuelve el motivo real de Stripe (p. ej. precio en modo distinto a la
    // clave) en vez de un 500 opaco, para poder diagnosticarlo.
    const msg = e instanceof Error ? e.message : 'Error de Stripe';
    console.error('[billing/checkout]', msg);
    return Response.json({ error: `Stripe: ${msg}` }, { status: 502 });
  }
}
