import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { membershipScope } from '@/lib/saas/scope';
import { publicDisplayName } from '@/lib/display';
import { hasAtLeastRole } from '@/lib/saas/roles';

/**
 * Jugadores de un tenant.
 *   GET   — listado (ADMIN u OWNER)
 *   PATCH — marcar pago / cambiar rol (ADMIN u OWNER, con límites)
 *
 * El dinero de la inscripción se cobra fuera de la plataforma: aquí el
 * organizador solo deja constancia de quién pagó, igual que hace PADELBOX.
 */
export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  membershipId: z.string().min(1),
  hasPaid: z.boolean().optional(),
  paidNote: z.string().trim().max(200).optional(),
  role: z.enum(['ADMIN', 'PLAYER']).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  const memberships = await prisma.saasMembership.findMany({
    where: membershipScope(ctx.tenant.id),
    orderBy: { createdAt: 'asc' },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: memberships.map((m) => m.userId) } },
    select: { id: true, name: true, email: true },
  });
  const byUserId = new Map(users.map((u) => [u.id, u]));

  const players = memberships.map((m) => {
    const user = byUserId.get(m.userId);
    return {
      membershipId: m.id,
      role: m.role,
      hasPaid: m.hasPaid,
      paidAt: m.paidAt,
      paidNote: m.paidNote,
      joinedAt: m.createdAt,
      // El organizador SÍ ve el email de sus propios jugadores: los tiene que
      // poder contactar. La máscara es para el ranking público.
      email: user?.email ?? null,
      name: m.displayName ?? (user ? publicDisplayName({ name: user.name, email: user.email }) : 'Jugador'),
    };
  });

  return Response.json({ players, total: players.length });
}

export async function PATCH(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 },
    );
  }
  const { membershipId, hasPaid, paidNote, role } = parsed.data;

  // Vía membershipScope: no se puede tocar la membership de otro comercio
  // aunque se conozca su id.
  const target = await prisma.saasMembership.findFirst({
    where: membershipScope(ctx.tenant.id, { id: membershipId }),
  });
  if (!target) return Response.json({ error: 'Jugador no encontrado.' }, { status: 404 });

  // El OWNER es intocable: degradarlo dejaría el tenant sin dueño, y sin
  // nadie que pueda gestionar la suscripción.
  if (target.role === 'OWNER') {
    return Response.json(
      { error: 'No se puede modificar al propietario del comercio.' },
      { status: 409 },
    );
  }

  // Un ADMIN no puede tocar a otro ADMIN; para eso está el OWNER.
  if (target.role === 'ADMIN' && !hasAtLeastRole(ctx.membership.role, 'OWNER')) {
    return Response.json(
      { error: 'Solo el propietario puede modificar a otro administrador.' },
      { status: 403 },
    );
  }

  const updated = await prisma.saasMembership.update({
    where: { id: target.id },
    data: {
      ...(hasPaid !== undefined ? { hasPaid, paidAt: hasPaid ? new Date() : null } : {}),
      ...(paidNote !== undefined ? { paidNote } : {}),
      ...(role !== undefined ? { role } : {}),
    },
    select: { id: true, role: true, hasPaid: true, paidAt: true, paidNote: true },
  });

  return Response.json({ ok: true, player: updated });
}
