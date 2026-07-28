import Stripe from 'stripe';
import type { StripeEventType } from './billing';

/**
 * Cliente y helpers de Stripe. Vive aparte de billing.ts (que es puro y
 * testeable) porque este módulo sí toca la red y las claves.
 *
 * REGLA QUE NO SE TOCA: se cobra SOLO en la web y solo al organizador. La app
 * iOS nunca enlaza a comprar — es lo que la deja fuera de la comisión de Apple.
 */

let client: Stripe | null = null;

/** Cliente Stripe lazy. Lanza si falta la clave (no llamar sin configurar). */
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY no configurada');
  if (!client) client = new Stripe(key);
  return client;
}

/** Price ID del plan Pro mensual (env, no secreto). */
export function proPriceId(): string {
  const id = process.env.STRIPE_PRICE_PRO;
  if (!id) throw new Error('STRIPE_PRICE_PRO no configurada');
  return id;
}

/** Price ID del Pro por temporada: pago ÚNICO, no recurrente. */
export function seasonPriceId(): string {
  const id = process.env.STRIPE_PRICE_PRO_SEASON;
  if (!id) throw new Error('STRIPE_PRICE_PRO_SEASON no configurada');
  return id;
}

/** Mapea el tipo de evento de Stripe a los que billing.ts sabe procesar. */
export function mapStripeEvent(type: string): StripeEventType | null {
  switch (type) {
    case 'checkout.session.completed':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.payment_failed':
    case 'invoice.payment_succeeded':
      return type;
    default:
      return null;
  }
}
