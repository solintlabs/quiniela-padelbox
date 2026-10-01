import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';

/**
 * Métodos de pago del tenant: cómo paga el jugador el bote al organizador.
 * Reutiliza el modelo PaymentMethod (tenantId), así que los de PADELBOX
 * (tenantId null) quedan intactos.
 *
 * GET  — cualquier miembro (lo necesita para inscribirse).
 * POST — ADMIN del tenant.
 */
export const dynamic = 'force-dynamic';

const fieldSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(200),
  mono: z.boolean().optional(),
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(60),
  subtitle: z.string().trim().max(80).optional(),
  icon: z.string().trim().max(8).optional(),
  type: z.string().trim().max(30).default('other'),
  fields: z.array(fieldSchema).max(8).default([]),
});

export async function GET(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'PLAYER', req);
  if (ctx instanceof Response) return ctx;

  const methods = await prisma.paymentMethod.findMany({
    where: { tenantId: ctx.tenant.id, enabled: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, type: true, title: true, subtitle: true, icon: true, fields: true },
  });
  return Response.json({ methods });
}

export async function POST(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 },
    );
  }

  const count = await prisma.paymentMethod.count({ where: { tenantId: ctx.tenant.id } });
  const method = await prisma.paymentMethod.create({
    data: {
      tenantId: ctx.tenant.id,
      type: parsed.data.type,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      icon: parsed.data.icon || null,
      fields: parsed.data.fields,
      sortOrder: count,
    },
    select: { id: true },
  });
  return Response.json({ ok: true, id: method.id });
}
