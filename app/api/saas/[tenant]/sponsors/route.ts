import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';

/**
 * Patrocinadores por tenant. Reutiliza el modelo `Sponsor` (tenantId) — los de
 * PADELBOX tienen tenantId null; los de un cliente SaaS llevan su tenantId.
 * Es un beneficio del plan Pro: en FREE no se pueden añadir.
 */
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  logoUrl: z.string().trim().url('URL inválida').max(500).optional().or(z.literal('')),
  url: z.string().trim().url('URL inválida').max(500).optional().or(z.literal('')),
});

export async function GET(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  const sponsors = await prisma.sponsor.findMany({
    where: { tenantId: ctx.tenant.id },
    orderBy: { sortOrder: 'asc' },
  });
  return Response.json({ sponsors });
}

export async function POST(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  if (ctx.tenant.plan === 'FREE') {
    return Response.json(
      { error: 'Los patrocinadores son parte del plan Pro.' },
      { status: 402 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const count = await prisma.sponsor.count({ where: { tenantId: ctx.tenant.id } });
  const sponsor = await prisma.sponsor.create({
    data: {
      tenantId: ctx.tenant.id,
      name: parsed.data.name,
      logoUrl: parsed.data.logoUrl || null,
      url: parsed.data.url || null,
      sortOrder: count,
    },
  });
  return Response.json({ sponsor });
}
