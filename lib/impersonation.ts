'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';

/**
 * Impersonación de usuarios por parte del admin.
 *
 * Mecanismo (NextAuth v5, sesiones en DB):
 * 1. Al impersonar, NO borramos la sesión del admin. Creamos una sesión nueva
 *    para el usuario objetivo y sobrescribimos la cookie de sesión con su token.
 * 2. Guardamos el token original del admin en una cookie aparte (impersonator)
 *    para poder volver.
 * 3. Al "Volver a admin", restauramos la cookie con el token del admin y
 *    limpiamos la sesión temporal del usuario objetivo.
 *
 * Solo el admin puede iniciar. La cookie del impersonator es httpOnly.
 */

const IMPERSONATOR_COOKIE = 'impersonator-token';
// Cookie de sesión de NextAuth v5: con prefijo __Secure- en HTTPS (prod).
const SESSION_COOKIE_SECURE = '__Secure-authjs.session-token';
const SESSION_COOKIE_PLAIN = 'authjs.session-token';

async function detectSessionCookieName(): Promise<string> {
  const c = await cookies();
  if (c.get(SESSION_COOKIE_SECURE)) return SESSION_COOKIE_SECURE;
  if (c.get(SESSION_COOKIE_PLAIN)) return SESSION_COOKIE_PLAIN;
  return process.env.NODE_ENV === 'production' ? SESSION_COOKIE_SECURE : SESSION_COOKIE_PLAIN;
}

/** ¿Hay una impersonación activa? Devuelve datos del usuario objetivo si sí. */
export async function getImpersonationState(): Promise<{
  active: boolean;
  targetName: string | null;
  targetEmail: string | null;
} | null> {
  const c = await cookies();
  const impersonatorToken = c.get(IMPERSONATOR_COOKIE)?.value;
  if (!impersonatorToken) return null;

  // El usuario actual (según la cookie de sesión) es el objetivo impersonado.
  const sessionName = await detectSessionCookieName();
  const currentToken = c.get(sessionName)?.value;
  if (!currentToken) return { active: true, targetName: null, targetEmail: null };

  const session = await prisma.session.findUnique({
    where: { sessionToken: currentToken },
    select: { user: { select: { name: true, email: true } } },
  });
  return {
    active: true,
    targetName: session?.user.name ?? null,
    targetEmail: session?.user.email ?? null,
  };
}

/** Inicia impersonación de un usuario. Solo admin. */
export async function impersonateUser(formData: FormData) {
  const admin = await requireAdmin();
  const targetId = String(formData.get('targetId') ?? '');
  if (!targetId) throw new Error('targetId requerido');
  if (targetId === admin.id) throw new Error('No puedes impersonarte a ti mismo');

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) throw new Error('Usuario no encontrado');

  const c = await cookies();
  const sessionName = await detectSessionCookieName();
  const adminToken = c.get(sessionName)?.value;
  if (!adminToken) throw new Error('No se encontró la sesión del admin');

  // Crear sesión temporal para el usuario objetivo (6h)
  const newToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 6 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { sessionToken: newToken, userId: targetId, expires },
  });

  const secure = sessionName.startsWith('__Secure-');
  // Guardar el token del admin para poder volver
  c.set(IMPERSONATOR_COOKIE, adminToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    expires,
  });
  // Sobrescribir la cookie de sesión con el token del usuario objetivo
  c.set(sessionName, newToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    expires,
  });

  redirect('/');
}

/** Termina la impersonación y vuelve a la cuenta admin. */
export async function stopImpersonation() {
  const c = await cookies();
  const adminToken = c.get(IMPERSONATOR_COOKIE)?.value;
  const sessionName = await detectSessionCookieName();
  const impersonatedToken = c.get(sessionName)?.value;

  if (adminToken) {
    const secure = sessionName.startsWith('__Secure-');
    // Restaurar la sesión del admin
    c.set(sessionName, adminToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure,
      // expira lejos; NextAuth gestiona la expiración real via la fila Session
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    // Limpiar la sesión temporal del usuario impersonado
    if (impersonatedToken && impersonatedToken !== adminToken) {
      await prisma.session.deleteMany({ where: { sessionToken: impersonatedToken } });
    }
    c.delete(IMPERSONATOR_COOKIE);
  }

  redirect('/admin/usuarios');
}
