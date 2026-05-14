import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

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
 * Uso:
 *   const user = await requireUserApi();
 *   if (user instanceof Response) return user;
 */
export async function requireUserApi(): Promise<Response | { id: string; role: 'USER' | 'ADMIN'; hasPaid: boolean; email: string }> {
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

export async function requireAdminApi() {
  const user = await requireUserApi();
  if (user instanceof Response) return user;
  if (user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Acceso restringido a administradores' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }
  return user;
}

export async function requirePaidApi() {
  const user = await requireUserApi();
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
