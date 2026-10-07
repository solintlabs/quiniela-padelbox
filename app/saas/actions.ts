'use server';

import { signOut } from '@/lib/auth';

/** Cierra la sesión y vuelve al inicio. Usado por los botones de la superficie SaaS. */
export async function saasSignOut(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
