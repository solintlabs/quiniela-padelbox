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
  // Logo subido (web o app): imagen ya reducida por el cliente, como data URL.
  logoDataUrl: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/, 'Imagen inválida.')
    .max(200_000, 'La imagen es demasiado grande.')
    .optional(),
  prizesText: z.string().trim().max(4000).nullable().optional(),
  rulesText: z.string().trim().max(4000).nullable().optional(),
  entryFee: z.string().trim().max(120).nullable().optional(),
  paymentInfo: z.string().trim().max(2000).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
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
  const { logoDataUrl, ...data } = parsed.data;
  // El logo subido pisa al de URL. Disponible en TODOS los planes: la marca
  // propia del organizador es parte del gancho; Pro se diferencia por
  // límites, sin anuncios y white-label.
  if (logoDataUrl) data.logoUrl = logoDataUrl;

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
      description: true,
    },
  });

  return Response.json({ tenant: updated });
}
