import type { Prisma } from '@prisma/client';

/**
 * Filtros scopeados por tenant. Puro, sin DB.
 *
 * El bug que mata a un SaaS multi-tenant es olvidar un `where` y servirle a un
 * comercio los datos de otro. Aquí no se escriben `where` a mano: se piden a
 * estas funciones, que devuelven el filtro ya acotado al tenant.
 *
 * El acotado va SIEMPRE dentro de un `AND`, nunca fusionado con el filtro que
 * pasa el llamador. Así un `extra` malicioso o descuidado (por ejemplo uno que
 * traiga su propio `tenantId`) no puede ensancharlo: en el peor caso añade una
 * condición más, jamás la sustituye.
 *
 * Regla: en /saas y /api/saas nunca se consulta una tabla Saas* sin pasar por
 * una de estas funciones.
 */

export function membershipScope(
  tenantId: string,
  extra?: Prisma.SaasMembershipWhereInput,
): Prisma.SaasMembershipWhereInput {
  return { AND: [{ tenantId }, extra ?? {}] };
}

export function competitionScope(
  tenantId: string,
  extra?: Prisma.SaasCompetitionWhereInput,
): Prisma.SaasCompetitionWhereInput {
  return { AND: [{ tenantId }, extra ?? {}] };
}

/** Los equipos cuelgan de la competición, que es quien conoce al tenant. */
export function teamScope(
  tenantId: string,
  extra?: Prisma.SaasTeamWhereInput,
): Prisma.SaasTeamWhereInput {
  return { AND: [{ competition: { tenantId } }, extra ?? {}] };
}

export function fixtureScope(
  tenantId: string,
  extra?: Prisma.SaasFixtureWhereInput,
): Prisma.SaasFixtureWhereInput {
  return { AND: [{ competition: { tenantId } }, extra ?? {}] };
}

/**
 * Un pronóstico pertenece a un tenant por partida doble: la membership del
 * jugador Y la competición del partido. Exigimos las dos para que un fixture
 * mal referenciado no filtre nada.
 */
export function entryScope(
  tenantId: string,
  extra?: Prisma.SaasEntryWhereInput,
): Prisma.SaasEntryWhereInput {
  return {
    AND: [
      { membership: { tenantId } },
      { fixture: { competition: { tenantId } } },
      extra ?? {},
    ],
  };
}
