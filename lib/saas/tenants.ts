import { randomBytes } from 'node:crypto';
import type { Tenant, SaasMembership } from '@prisma/client';
import { prisma } from '@/lib/db';
import { normalizeSlug, isValidSlug } from '@/lib/saas/slug';
import { canAddPlayer } from '@/lib/saas/plans';

/**
 * Alta de comercios y de jugadores.
 *
 * Aquí vive el puente con el mundo viejo: `userId` es un `User.id` guardado
 * como String suelto, sin FK. A cambio de no tocar el modelo User, la
 * integridad la mantenemos nosotros (ver `removeUserFromAllTenants`).
 */

export class SlugTakenError extends Error {
  constructor(public readonly slug: string) {
    super(`El identificador "${slug}" ya está en uso.`);
    this.name = 'SlugTakenError';
  }
}

export class InvalidSlugError extends Error {
  constructor(public readonly slug: string) {
    super(
      `"${slug}" no vale como identificador. Usa 3-40 letras minúsculas, números o guiones.`,
    );
    this.name = 'InvalidSlugError';
  }
}

/**
 * Propone un slug libre a partir del nombre del comercio.
 * Si "bar-manolo" está cogido prueba "bar-manolo-2", "bar-manolo-3"...
 */
export async function suggestSlug(name: string): Promise<string | null> {
  const base = normalizeSlug(name);
  if (!isValidSlug(base)) {
    // El nombre no da un slug válido (todo símbolos, demasiado corto...).
    // El organizador tendrá que escribirlo a mano.
    return null;
  }

  const candidates = [base, ...Array.from({ length: 20 }, (_, i) => `${base}-${i + 2}`)].filter(
    isValidSlug,
  );
  const taken = await prisma.tenant.findMany({
    where: { slug: { in: candidates } },
    select: { slug: true },
  });
  const takenSet = new Set(taken.map((t) => t.slug));
  return candidates.find((c) => !takenSet.has(c)) ?? null;
}

export interface CreateTenantInput {
  slug: string;
  name: string;
  ownerUserId: string;
  ownerEmail: string;
  logoUrl?: string | null;
  accentColor?: string;
  defaultLocale?: string;
  description?: string | null;
}

/**
 * Crea el comercio y deja al fundador como OWNER, en una transacción: no
 * puede existir un Tenant sin dueño (quedaría inaccesible para siempre).
 *
 * Nace en TRIAL, no en LEAD: quien completa el alta ya puede trabajar. El
 * plan arranca en FREE y sube cuando pague.
 */
export async function createTenantWithOwner(
  input: CreateTenantInput,
): Promise<{ tenant: Tenant; membership: SaasMembership }> {
  const slug = normalizeSlug(input.slug);
  if (!isValidSlug(slug)) throw new InvalidSlugError(input.slug);

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) throw new SlugTakenError(slug);

  try {
    return await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name: input.name.trim(),
          adminEmail: input.ownerEmail,
          logoUrl: input.logoUrl ?? null,
          accentColor: input.accentColor ?? '#B6FF3C',
          defaultLocale: input.defaultLocale ?? 'es',
          description: input.description?.trim() || null,
          status: 'TRIAL',
          plan: 'FREE',
          trialEndsAt: new Date(Date.now() + 30 * 86_400_000),
        },
      });

      const membership = await tx.saasMembership.create({
        data: {
          tenantId: tenant.id,
          userId: input.ownerUserId,
          role: 'OWNER',
          // El dueño no se paga a sí mismo la entrada al bote.
          hasPaid: true,
        },
      });

      return { tenant, membership };
    });
  } catch (e) {
    // Carrera: otro alta cogió el slug entre el findUnique y el create.
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      throw new SlugTakenError(slug);
    }
    throw e;
  }
}

/** Token de invitación: opaco, suficientemente largo para no adivinarse. */
export function generateInviteToken(): string {
  return randomBytes(24).toString('base64url');
}

export class PlanLimitError extends Error {
  constructor(message: string, public readonly reason: string) {
    super(message);
    this.name = 'PlanLimitError';
  }
}

/**
 * Apunta a un usuario en un tenant como jugador.
 *
 * Idempotente: si ya es miembro devuelve su membership sin tocar el rol —
 * volver a entrar por el link de invitación no debe degradar a un ADMIN.
 */
export async function joinTenantAsPlayer(
  tenantId: string,
  userId: string,
): Promise<SaasMembership> {
  const existing = await prisma.saasMembership.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  });
  if (existing) return existing;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });
  if (!tenant) throw new Error('Tenant no encontrado');

  const currentPlayers = await prisma.saasMembership.count({ where: { tenantId } });
  const gate = canAddPlayer(tenant.plan, currentPlayers);
  if (!gate.allowed) {
    throw new PlanLimitError(gate.message ?? 'Límite del plan alcanzado.', gate.reason ?? 'unknown');
  }

  return prisma.saasMembership.create({
    data: { tenantId, userId, role: 'PLAYER' },
  });
}

/**
 * Limpia las memberships de un usuario borrado.
 *
 * Como `userId` no es una FK, la cascada de Postgres no llega hasta aquí: si
 * algún día se borra un User hay que llamar a esto o quedarían memberships
 * huérfanas apuntando a un id inexistente. Es el precio de no tocar el modelo
 * User de PADELBOX.
 */
export async function removeUserFromAllTenants(userId: string): Promise<number> {
  const { count } = await prisma.saasMembership.deleteMany({ where: { userId } });
  return count;
}
