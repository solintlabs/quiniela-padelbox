import { redirect, notFound } from 'next/navigation';
import type { SaasMembership, SaasRole, Tenant } from '@prisma/client';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireUserApi } from '@/lib/permissions';
import { isSaasEnabled, requireSaasEnabled } from '@/lib/saas/flags';
import { resolveTenant } from '@/lib/saas/tenant';
import { hasAtLeastRole } from '@/lib/saas/roles';

/**
 * Autorización del SaaS, scopeada por tenant.
 *
 * Consume `requireUserApi` de lib/permissions.ts en modo solo-lectura: se
 * respetan sus dos vías de autenticación (JWT Bearer de la app móvil y sesión
 * NextAuth de la web) sin cambiar su firma ni sus llamadores. Lo que se añade
 * encima es la pertenencia al tenant.
 *
 * Decisión de seguridad: a quien NO es miembro se le responde 404, no 403.
 * Un 403 confirmaría que el comercio existe y permitiría enumerar la lista de
 * clientes probando slugs.
 */

export interface TenantContext {
  tenant: Tenant;
  membership: SaasMembership;
  userId: string;
}

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Membership de un usuario en un tenant, o null. */
export async function getTenantMembership(
  tenantId: string,
  userId: string,
): Promise<SaasMembership | null> {
  return prisma.saasMembership.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  });
}

/**
 * Guard para route handlers de /api/saas/[tenant]/...
 *
 *   const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
 *   if (ctx instanceof Response) return ctx;
 *   // aquí ctx.tenant y ctx.membership están garantizados
 */
export async function requireTenantRoleApi(
  slug: string,
  minimum: SaasRole,
  req?: Request,
): Promise<Response | TenantContext> {
  const off = requireSaasEnabled();
  if (off) return off;

  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const tenant = await resolveTenant(slug);
  if (!tenant) return jsonError(404, 'No encontrado');

  const membership = await getTenantMembership(tenant.id, user.id);
  if (!membership) return jsonError(404, 'No encontrado');

  if (!hasAtLeastRole(membership.role, minimum)) {
    return jsonError(403, 'Acceso restringido');
  }

  return { tenant, membership, userId: user.id };
}

/** Atajo: cualquier miembro del tenant, sin exigir rol concreto. */
export async function requireTenantMemberApi(
  slug: string,
  req?: Request,
): Promise<Response | TenantContext> {
  return requireTenantRoleApi(slug, 'PLAYER', req);
}

/**
 * Guard para páginas de /saas/[tenant]/...
 * Redirige a login si no hay sesión; 404 en cualquier otro fallo.
 */
export async function requireTenantRolePage(
  slug: string,
  minimum: SaasRole,
): Promise<TenantContext> {
  if (!isSaasEnabled()) notFound();

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/saas/${slug}`)}`);
  }

  const tenant = await resolveTenant(slug);
  if (!tenant) notFound();

  const membership = await getTenantMembership(tenant.id, session.user.id);
  if (!membership) notFound();
  if (!hasAtLeastRole(membership.role, minimum)) notFound();

  return { tenant, membership, userId: session.user.id };
}
