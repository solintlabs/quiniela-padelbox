import type { Tenant, TenantStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { normalizeSlug, isValidSlug } from '@/lib/saas/slug';

/**
 * Resolución de tenant para las rutas /saas/[tenant]/... y
 * /api/saas/[tenant]/...
 *
 * Deliberadamente NO hay middleware ni resolución por subdominio: un
 * middleware se ejecutaría en la ruta de TODAS las peticiones del proyecto,
 * incluidas las /api/* que consume la app publicada en las stores. El tenant
 * sale del segmento de URL, que solo afecta a rutas nuevas.
 */

/**
 * ¿Este tenant puede servir tráfico? Puro, sin DB.
 *
 * LEAD           — rellenó el formulario pero nunca completó el alta.
 * TRIAL / ACTIVE — operativo.
 * PAYMENT_FAILED — sigue abierto: cortarle la quiniela a mitad de torneo por
 *                  una tarjeta caducada castiga a los jugadores, no al que
 *                  debe. El aviso de cobro se le muestra al organizador.
 * SUSPENDED / CANCELLED — cerrado.
 */
export function isTenantAccessible(status: TenantStatus): boolean {
  return status === 'TRIAL' || status === 'ACTIVE' || status === 'PAYMENT_FAILED';
}

/**
 * Busca el tenant por slug. Devuelve null si el slug no es válido, no existe
 * o el tenant no está accesible — los tres casos se tratan igual (404) para
 * no revelar qué comercios existen.
 */
export async function resolveTenant(slugRaw: string): Promise<Tenant | null> {
  const slug = normalizeSlug(slugRaw);
  if (!isValidSlug(slug)) return null;

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return null;
  if (!isTenantAccessible(tenant.status)) return null;

  return tenant;
}
