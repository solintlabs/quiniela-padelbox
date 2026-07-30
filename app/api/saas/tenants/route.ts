import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';
import { requireSaasEnabled } from '@/lib/saas/flags';
import {
  createTenantWithOwner,
  suggestSlug,
  SlugTakenError,
  InvalidSlugError,
} from '@/lib/saas/tenants';

/**
 * Tope de quinielas que un mismo usuario puede TENER creadas (como OWNER).
 * Sin esto, cualquier cuenta podría inflar la base de datos con miles de
 * tenants (y desde la app ahora se crea en dos toques). Quien de verdad
 * necesite más, que escriba: es señal de cliente CUSTOM, no de spam.
 */
const MAX_OWNED_TENANTS = 5;

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
  // Logo subido desde el wizard: el cliente lo reduce a ≤256px y lo manda
  // como data URL. Se guarda tal cual en Tenant.logoUrl (los <img> y
  // expo-image lo pintan igual que una URL). ~150KB máx tras el base64.
  logoDataUrl: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/, 'Imagen inválida.')
    .max(200_000, 'La imagen es demasiado grande.')
    .optional(),
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

  // Anti-abuso: ráfagas cortas fuera, y un tope total de quinielas por dueño.
  const rl = await rateLimit(`saas-create:${user.id}`, 3, 600);
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  const owned = await prisma.saasMembership.count({
    where: { userId: user.id, role: 'OWNER' },
  });
  if (owned >= MAX_OWNED_TENANTS) {
    return Response.json(
      {
        error: `Ya tienes ${MAX_OWNED_TENANTS} quinielas creadas. Si necesitas más, escríbenos a info@solint.cloud.`,
      },
      { status: 403 },
    );
  }

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
  const { name, accentColor, logoUrl, logoDataUrl, defaultLocale } = parsed.data;
  const logo = logoDataUrl ?? logoUrl ?? null;

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
      logoUrl: logo,
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
