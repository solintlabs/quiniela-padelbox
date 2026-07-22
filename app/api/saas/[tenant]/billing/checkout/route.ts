import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { isBillingConfigured } from '@/lib/saas/billing';
import { stripe, proPriceId } from '@/lib/saas/stripe';

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

  const origin = new URL(req.url).origin;
  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: proPriceId(), quantity: 1 }],
    client_reference_id: tenant.id,
    subscription_data: { metadata: { tenantId: tenant.id } },
    // Permite cupones (p. ej. el 100% para la compra de verificación).
    allow_promotion_codes: true,
    success_url: `${origin}/saas/${tenant.slug}/panel?upgraded=1`,
    cancel_url: `${origin}/saas/${tenant.slug}/panel`,
  });

  return Response.json({ url: session.url });
}
