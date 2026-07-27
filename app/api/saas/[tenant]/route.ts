import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';

/**
 * PATCH /api/saas/[tenant]
 *
 * Ajustes de la quiniela del organizador: nombre, color de acento, logo y
 * premios. Solo el OWNER (quien creó el tenant) los edita. El logo y (más
 * adelante) quitar la marca QuinielaBOX son beneficios del plan Pro.
 */
export const dynamic = 'force-dynamic';

const hex = /^#[0-9a-fA-F]{6}$/;

const patchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  accentColor: z.string().regex(hex, 'Color inválido').optional(),
  logoUrl: z.string().trim().url('URL inválida').max(500).nullable().optional(),
  prizesText: z.string().trim().max(4000).nullable().optional(),
  rulesText: z.string().trim().max(4000).nullable().optional(),
  entryFee: z.string().trim().max(120).nullable().optional(),
  paymentInfo: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'OWNER', req);
  if (ctx instanceof Response) return ctx;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const data = parsed.data;

  // El logo es un beneficio Pro: en FREE se ignora para no dar branding propio.
  if (ctx.tenant.plan === 'FREE') {
    delete data.logoUrl;
  }

  const updated = await prisma.tenant.update({
    where: { id: ctx.tenant.id },
    data,
    select: {
      name: true,
      accentColor: true,
      logoUrl: true,
      prizesText: true,
      rulesText: true,
      entryFee: true,
      paymentInfo: true,
    },
  });

  return Response.json({ tenant: updated });
}
