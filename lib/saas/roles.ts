import type { SaasRole } from '@prisma/client';

/**
 * Jerarquía de roles dentro de un tenant. Puro, sin DB.
 *
 * OWNER  — creó el tenant. Único que toca facturación y puede borrarlo.
 * ADMIN  — gestiona competición, jugadores, resultados y premios.
 * PLAYER — solo pronostica.
 */
const RANK: Record<SaasRole, number> = {
  PLAYER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function hasAtLeastRole(role: SaasRole, minimum: SaasRole): boolean {
  return RANK[role] >= RANK[minimum];
}

/** Crear/editar competiciones, fixtures, resultados y jugadores. */
export function canManageCompetition(role: SaasRole): boolean {
  return hasAtLeastRole(role, 'ADMIN');
}

/**
 * Suscripción, plan y datos de Stripe. Solo el OWNER — un ADMIN invitado no
 * debe poder cambiar lo que se le cobra a otro.
 */
export function canManageBilling(role: SaasRole): boolean {
  return role === 'OWNER';
}
