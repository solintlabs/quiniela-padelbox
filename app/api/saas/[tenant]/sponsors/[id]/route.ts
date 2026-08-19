import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';

/** DELETE /api/saas/[tenant]/sponsors/[id] — quita un patrocinador del tenant. */
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: { tenant: string; id: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  // El scope por tenantId evita borrar patrocinadores de otro tenant.
  await prisma.sponsor.deleteMany({
    where: { id: params.id, tenantId: ctx.tenant.id },
  });
  return Response.json({ ok: true });
}
