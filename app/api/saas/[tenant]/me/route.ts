import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';

/**
 * PATCH /api/saas/[tenant]/me
 *
 * El jugador cambia CÓMO SE LLAMA en esta quiniela. Es por membresía, no por
 * usuario: la misma persona puede ser "Sergio" en el club y "Chechu" en la
 * peña de amigos. No toca su cuenta global.
 */
export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  displayName: z.string().trim().min(2, 'Nombre demasiado corto.').max(40).nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'PLAYER', req);
  if (ctx instanceof Response) return ctx;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 },
    );
  }

  const updated = await prisma.saasMembership.update({
    where: { id: ctx.membership.id },
    data: { displayName: parsed.data.displayName || null },
    select: { displayName: true },
  });

  return Response.json({ ok: true, ...updated });
}
