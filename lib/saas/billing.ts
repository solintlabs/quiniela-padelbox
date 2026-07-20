import type { TenantPlan, TenantStatus } from '@prisma/client';

/**
 * Suscripción del organizador.
 *
 * ESTADO: la máquina de estados y el gating están listos y testeados. Lo que
 * NO está hecho a propósito es la integración con claves reales de Stripe,
 * porque el modelo de negocio (precios, si hay pago único por torneo, si hay
 * anuncios) está sin decidir. Cuando se decida, solo falta:
 *   1. `npm i stripe`
 *   2. rellenar STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET
 *   3. llamar a `applyStripeEvent` desde el webhook con el evento verificado
 * Nada de lo de aquí cambia.
 *
 * REGLA QUE NO SE TOCA: el cobro es siempre en la WEB y solo al organizador.
 * La app iOS no vende nada ni enlaza a comprar. Eso es lo que mantiene la app
 * fuera de la clasificación de concursos con premio de Apple.
 */

/** Eventos de Stripe que nos importan. El resto se ignoran. */
export type StripeEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_failed'
  | 'invoice.payment_succeeded';

export interface TenantBillingState {
  status: TenantStatus;
  plan: TenantPlan;
}

/**
 * Cómo cambia el estado del comercio ante un evento de facturación. Puro.
 *
 * Decisión deliberada: un impago NO suspende. Pasa a PAYMENT_FAILED, que
 * sigue sirviendo la quiniela (ver isTenantAccessible). Cortarle el torneo a
 * mitad a cincuenta jugadores por una tarjeta caducada castiga a quien no
 * tiene la culpa y garantiza que el organizador no renueve. Suspender es una
 * decisión manual, no automática.
 */
export function applyStripeEvent(
  current: TenantBillingState,
  event: StripeEventType,
  targetPlan?: TenantPlan,
): TenantBillingState {
  switch (event) {
    case 'checkout.session.completed':
      return { status: 'ACTIVE', plan: targetPlan ?? current.plan };

    case 'invoice.payment_succeeded':
      // Recuperación tras un impago: vuelve a la normalidad.
      return { status: 'ACTIVE', plan: targetPlan ?? current.plan };

    case 'customer.subscription.updated':
      // Cambio de plan estando al día. Si venía de un impago, no lo damos por
      // resuelto: eso lo confirma invoice.payment_succeeded.
      return {
        status: current.status === 'PAYMENT_FAILED' ? current.status : 'ACTIVE',
        plan: targetPlan ?? current.plan,
      };

    case 'invoice.payment_failed':
      return { status: 'PAYMENT_FAILED', plan: current.plan };

    case 'customer.subscription.deleted':
      // Cancelación: se cae al plan gratuito, no se borra nada. Los datos del
      // comercio siguen ahí si vuelve.
      return { status: 'CANCELLED', plan: 'FREE' };
  }
}

/** ¿Sigue en periodo de prueba? Puro. */
export function isTrialActive(
  status: TenantStatus,
  trialEndsAt: Date | null,
  now: Date,
): boolean {
  if (status !== 'TRIAL') return false;
  if (!trialEndsAt) return true;
  return trialEndsAt.getTime() > now.getTime();
}

/**
 * Días que quedan de prueba, para el aviso del panel.
 * Devuelve 0 si ya venció y null si no aplica.
 */
export function trialDaysLeft(
  status: TenantStatus,
  trialEndsAt: Date | null,
  now: Date,
): number | null {
  if (status !== 'TRIAL' || !trialEndsAt) return null;
  const ms = trialEndsAt.getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

/** ¿Está Stripe configurado en este entorno? */
export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}
