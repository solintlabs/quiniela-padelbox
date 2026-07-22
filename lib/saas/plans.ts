import type { TenantPlan } from '@prisma/client';

/**
 * Planes del SaaS. Fichero único y editable a mano: cambiar precios o límites
 * no debe exigir tocar lógica repartida por el código.
 *
 * El cobro es SIEMPRE en la web, con Stripe, y solo al organizador. La app
 * iOS no vende nada ni enlaza a comprar: mantenerlo así es lo que deja la
 * app fuera de la clasificación de concursos con premio de Apple.
 *
 * Los precios son informativos para la landing; la verdad de lo que se cobra
 * vive en Stripe.
 */

export interface PlanLimits {
  /** Jugadores por tenant. Infinity = sin límite. */
  maxPlayers: number;
  /** Competiciones simultáneas. */
  maxCompetitions: number;
  /** Puede importar del catálogo de ESPN (si no, solo manual/CSV). */
  espnCatalog: boolean;
  /** Puede quitar el "Powered by QuinielaBOX". */
  removeBranding: boolean;
  /** Se muestran anuncios a sus jugadores. */
  showsAds: boolean;
}

export interface Plan {
  id: TenantPlan;
  name: string;
  /** Precio en USD. 0 = gratis. null = a medida. */
  priceUsd: number | null;
  /** "mes" | "torneo" | null */
  period: 'mes' | 'torneo' | null;
  tagline: string;
  limits: PlanLimits;
}

export const PLANS: Record<TenantPlan, Plan> = {
  FREE: {
    id: 'FREE',
    name: 'Gratis',
    priceUsd: 0,
    period: null,
    tagline: 'Para probar con tu grupo de amigos.',
    limits: {
      maxPlayers: 15,
      maxCompetitions: 1,
      espnCatalog: false,
      removeBranding: false,
      showsAds: true,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    priceUsd: 9,
    period: 'mes',
    tagline: 'Para clubes y comercios que lo hacen en serio.',
    limits: {
      maxPlayers: 500,
      maxCompetitions: 5,
      espnCatalog: true,
      removeBranding: true,
      showsAds: false,
    },
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'A medida',
    priceUsd: null,
    period: null,
    tagline: 'White-label, dominio propio y soporte directo.',
    limits: {
      maxPlayers: Number.POSITIVE_INFINITY,
      maxCompetitions: Number.POSITIVE_INFINITY,
      espnCatalog: true,
      removeBranding: true,
      showsAds: false,
    },
  },
};

export function limitsFor(plan: TenantPlan): PlanLimits {
  return PLANS[plan].limits;
}

export type GateReason =
  | 'max-players'
  | 'max-competitions'
  | 'espn-catalog'
  | 'remove-branding';

export interface GateResult {
  allowed: boolean;
  reason?: GateReason;
  /** Mensaje listo para enseñar al organizador, en su idioma de la web. */
  message?: string;
}

const ALLOWED: GateResult = { allowed: true };

/**
 * ¿Cabe un jugador más? Puro.
 *
 * Se comprueba ANTES de crear la membership. El mensaje explica el límite y
 * qué hacer, no solo que no se puede.
 */
export function canAddPlayer(plan: TenantPlan, currentPlayers: number): GateResult {
  const { maxPlayers } = limitsFor(plan);
  if (currentPlayers < maxPlayers) return ALLOWED;
  return {
    allowed: false,
    reason: 'max-players',
    message: `El plan ${PLANS[plan].name} admite hasta ${maxPlayers} jugadores. Mejora de plan para invitar a más.`,
  };
}

export function canAddCompetition(plan: TenantPlan, currentCompetitions: number): GateResult {
  const { maxCompetitions } = limitsFor(plan);
  if (currentCompetitions < maxCompetitions) return ALLOWED;
  return {
    allowed: false,
    reason: 'max-competitions',
    message: `El plan ${PLANS[plan].name} permite ${maxCompetitions} competición${maxCompetitions === 1 ? '' : 'es'} a la vez.`,
  };
}

export function canUseEspnCatalog(plan: TenantPlan): GateResult {
  if (limitsFor(plan).espnCatalog) return ALLOWED;
  return {
    allowed: false,
    reason: 'espn-catalog',
    message:
      'El catálogo de ligas está disponible a partir del plan Pro. Con el plan Gratis puedes crear los partidos a mano o importarlos por CSV.',
  };
}

/** ¿Se le enseña el "Powered by" y los anuncios a los jugadores de este tenant? */
export function showsBranding(plan: TenantPlan): boolean {
  return !limitsFor(plan).removeBranding;
}

export function showsAds(plan: TenantPlan): boolean {
  return limitsFor(plan).showsAds;
}
