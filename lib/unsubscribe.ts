import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';

/**
 * Baja de correos no imprescindibles.
 *
 * Qué se puede dar de baja: recordatorios de pronósticos, avisos de ronda y
 * promociones. Qué NO: magic link y código de acceso — sin esos la persona no
 * puede entrar, así que se envían siempre.
 *
 * El enlace lleva un token propio en la URL para que dar de baja sea un clic,
 * sin iniciar sesión (que es justo lo que no va a hacer quien está harto de
 * recibir correos).
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quinielabox.com';

/** Token de baja del usuario; lo crea la primera vez que hace falta. */
export async function unsubTokenFor(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { unsubToken: true },
  });
  if (user?.unsubToken) return user.unsubToken;

  const token = randomBytes(24).toString('base64url');
  await prisma.user.update({ where: { id: userId }, data: { unsubToken: token } });
  return token;
}

export function unsubUrl(token: string): string {
  return `${SITE}/baja/${token}`;
}

/**
 * De una lista de userIds, quita a quien se dio de baja y devuelve el email y
 * su enlace de baja. Es el único sitio por el que deberían pasar los envíos
 * masivos: así no hay forma de saltarse la preferencia por descuido.
 */
export async function recipientsForBulk(
  userIds: string[],
): Promise<Array<{ userId: string; email: string; unsubUrl: string }>> {
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, emailOptOut: false },
    select: { id: true, email: true, unsubToken: true },
  });

  const out: Array<{ userId: string; email: string; unsubUrl: string }> = [];
  for (const u of users) {
    if (!u.email) continue;
    const token = u.unsubToken ?? (await unsubTokenFor(u.id));
    out.push({ userId: u.id, email: u.email, unsubUrl: unsubUrl(token) });
  }
  return out;
}
