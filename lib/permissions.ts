import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { verifyAppToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') redirect('/');
  return user;
}

/**
 * Para rutas API. Lanza Response 401/403 en lugar de redirigir.
 * Acepta DOS formas de autenticación:
 *   1. JWT Bearer en header Authorization (app móvil)
 *   2. Sesión NextAuth via cookie (web)
 * Uso:
 *   const user = await requireUserApi(req);
 *   if (user instanceof Response) return user;
 */
export async function requireUserApi(req?: Request): Promise<Response | { id: string; role: 'USER' | 'ADMIN'; hasPaid: boolean; email: string }> {
  // 1. Probar JWT Bearer (móvil)
  const authHeader = req?.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    // Si parece un cron secret, ignorar (esos los maneja verifyCronSecret)
    if (token && token !== process.env.CRON_SECRET) {
      const payload = await verifyAppToken(token);
      if (payload) {
        // Reconfirma hasPaid contra DB porque puede haber cambiado tras emitir el JWT
        const fresh = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, email: true, role: true, hasPaid: true },
        });
        if (fresh) {
          return { id: fresh.id, email: fresh.email, role: fresh.role, hasPaid: fresh.hasPaid };
        }
      }
    }
  }

  // 2. Fallback a sesión NextAuth (web)
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
  return {
    id: session.user.id,
    role: session.user.role,
    hasPaid: session.user.hasPaid,
    email: session.user.email ?? '',
  };
}

export async function requireAdminApi(req?: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;
  if (user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Acceso restringido a administradores' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }
  return user;
}

export async function requirePaidApi(req?: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;
  if (!user.hasPaid) {
    return new Response(
      JSON.stringify({
        error: 'Inscripción pendiente',
        message: 'Tu cuenta aún no está activada. Contacta con PADELBOX para validar el pago.',
      }),
      { status: 403, headers: { 'content-type': 'application/json' } },
    );
  }
  return user;
}

/** Comprueba el header de los crons. */
export function verifyCronSecret(req: Request): Response | null {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new Response('Forbidden', { status: 403 });
  }
  return null;
}
