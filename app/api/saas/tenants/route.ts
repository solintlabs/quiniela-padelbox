import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';
import { requireSaasEnabled } from '@/lib/saas/flags';
import {
  createTenantWithOwner,
  suggestSlug,
  SlugTakenError,
  InvalidSlugError,
} from '@/lib/saas/tenants';

/**
 * POST /api/saas/tenants — alta de un comercio nuevo.
 *
 * Cualquier usuario autenticado puede crear el suyo: es el corazón del
 * self-service. Entra con el mismo magic link de siempre y sale siendo OWNER
 * de su tenant.
 */
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  name: z.string().trim().min(2, 'El nombre es demasiado corto.').max(80),
  slug: z.string().trim().min(3).max(40).optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'El color debe ser un hex tipo #B6FF3C.')
    .optional(),
  logoUrl: z.string().url().max(500).optional().nullable(),
  defaultLocale: z.enum(['es', 'en', 'pt']).optional(),
});

/**
 * GET /api/saas/tenants — las quinielas del usuario (para el selector del móvil
 * y cualquier cliente con JWT). Devuelve una entrada por membresía SaaS.
 */
export async function GET(req: Request): Promise<Response> {
  const off = requireSaasEnabled();
  if (off) return off;

  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const memberships = await prisma.saasMembership.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: {
      role: true,
      hasPaid: true,
      tenant: { select: { slug: true, name: true, accentColor: true, logoUrl: true, plan: true } },
    },
  });

  return Response.json({
    tenants: memberships.map((m) => ({
      slug: m.tenant.slug,
      name: m.tenant.name,
      accentColor: m.tenant.accentColor,
      logoUrl: m.tenant.logoUrl,
      plan: m.tenant.plan,
      role: m.role,
      hasPaid: m.hasPaid,
    })),
  });
}

export async function POST(req: Request): Promise<Response> {
  const off = requireSaasEnabled();
  if (off) return off;

  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 },
    );
  }
  const { name, accentColor, logoUrl, defaultLocale } = parsed.data;

  // Si no manda slug, se propone uno a partir del nombre.
  const slug = parsed.data.slug ?? (await suggestSlug(name));
  if (!slug) {
    return Response.json(
      { error: 'No se pudo generar un identificador con ese nombre. Escríbelo tú.' },
      { status: 400 },
    );
  }

  try {
    const { tenant } = await createTenantWithOwner({
      slug,
      name,
      ownerUserId: user.id,
      ownerEmail: user.email,
      accentColor,
      logoUrl: logoUrl ?? null,
      defaultLocale,
    });

    return Response.json(
      {
        ok: true,
        tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
        panelUrl: `/saas/${tenant.slug}/panel`,
      },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof SlugTakenError || e instanceof InvalidSlugError) {
      return Response.json({ error: e.message }, { status: 409 });
    }
    console.error('[saas/tenants] alta fallida:', e);
    return Response.json({ error: 'No se pudo crear el comercio.' }, { status: 500 });
  }
}
