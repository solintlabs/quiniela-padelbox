import { auth, signOut } from '@/lib/auth';
import { BottomQuickNav } from './BottomQuickNav';

/**
 * Server component wrapper que comprueba si hay sesion. Si la hay, monta el
 * tab bar inferior. Si no, no renderiza nada. Permite añadir el tab bar a
 * layouts publicos (legal, lanza-tu-quiniela, soporte...) sin romperlos para
 * visitantes anónimos.
 */
export async function BottomQuickNavIfAuth() {
  const session = await auth();
  if (!session?.user) return null;

  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <BottomQuickNav
      hasPaid={!!session.user.hasPaid}
      isAdmin={session.user.role === 'ADMIN'}
      userEmail={session.user.email ?? null}
      signOutAction={signOutAction}
    />
  );
}
