import type Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { applyStripeEvent } from '@/lib/saas/billing';
import { PLANS } from '@/lib/saas/plans';
import { stripe, mapStripeEvent } from '@/lib/saas/stripe';

/**
 * POST /api/saas/billing/webhook
 *
 * Recibe los eventos de Stripe, verifica la firma y delega el cambio de estado
 * en `applyStripeEvent` (puro, testeado). NO se gatea con SAAS_ENABLED: lo
 * llama Stripe, no un usuario, y debe responder 200 siempre que pueda.
 *
 * Requiere body crudo para verificar la firma → runtime nodejs y req.text().
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook no configurado', { status: 503 });

  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('Falta la firma', { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return new Response(`Firma inválida: ${e instanceof Error ? e.message : ''}`, { status: 400 });
  }

  const mapped = mapStripeEvent(event.type);
  if (!mapped) return Response.json({ received: true });

  const tenantId = await tenantIdFromEvent(event);
  if (!tenantId) return Response.json({ received: true });

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return Response.json({ received: true });

  const next = applyStripeEvent({ status: tenant.status, plan: tenant.plan }, mapped, 'PRO');
  const subId = subscriptionIdFromEvent(event);

  // Compra por TEMPORADA: es un pago único, no genera suscripción. Se concede
  // Pro hasta `proUntil`; un cron lo baja a FREE al vencer.
  const obj = event.data.object as unknown as Record<string, unknown>;
  const isSeason =
    mapped === 'checkout.session.completed' &&
    obj.mode === 'payment' &&
    (obj.metadata as Record<string, string> | undefined)?.kind === 'season';

  let proUntil: Date | undefined;
  if (isSeason) {
    const months = PLANS.PRO.season?.months ?? 6;
    const from =
      tenant.proUntil && tenant.proUntil.getTime() > Date.now() ? tenant.proUntil : new Date();
    proUntil = new Date(from);
    proUntil.setMonth(proUntil.getMonth() + months);
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      status: next.status,
      plan: next.plan,
      ...(proUntil ? { proUntil } : {}),
      ...(mapped === 'customer.subscription.deleted'
        ? { stripeSubId: null }
        : subId
          ? { stripeSubId: subId }
          : {}),
    },
  });

  return Response.json({ received: true });
}

/** tenantId del evento: metadata → client_reference_id → por stripeCustomerId. */
async function tenantIdFromEvent(event: Stripe.Event): Promise<string | null> {
  const obj = event.data.object as unknown as Record<string, unknown>;

  const meta = (obj.metadata as Record<string, string> | undefined)?.tenantId;
  if (meta) return meta;

  if (typeof obj.client_reference_id === 'string') return obj.client_reference_id;

  const customer = obj.customer;
  if (typeof customer === 'string') {
    const t = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customer },
      select: { id: true },
    });
    return t?.id ?? null;
  }

  return null;
}

/** subscriptionId del evento, para guardarlo en el tenant. */
function subscriptionIdFromEvent(event: Stripe.Event): string | null {
  const obj = event.data.object as unknown as Record<string, unknown>;
  if (event.type.startsWith('customer.subscription')) {
    return typeof obj.id === 'string' ? obj.id : null;
  }
  if (event.type === 'checkout.session.completed') {
    return typeof obj.subscription === 'string' ? obj.subscription : null;
  }
  return null;
}
