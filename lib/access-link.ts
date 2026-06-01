'use server';

import { revalidatePath } from 'next/cache';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';

/**
 * Enlaces de acceso permanente: el admin genera un token aleatorio por usuario.
 * Quien tenga el link `/entrar/<token>` entra directo a esa cuenta sin email
 * ni codigo. Pensado para gente poco tecnologica. Revocable regenerandolo.
 */

function newToken(): string {
  // 24 bytes -> 32 chars base64url, suficientemente impredecible.
  return crypto.randomBytes(24).toString('base64url');
}

/** Genera (o regenera) el token de acceso de un usuario. Devuelve el token. */
export async function generateAccessLink(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  if (!userId) throw new Error('userId requerido');
  await prisma.user.update({
    where: { id: userId },
    data: { accessToken: newToken() },
  });
  revalidatePath('/admin/usuarios');
}

/** Revoca el token de acceso de un usuario (el link viejo deja de funcionar). */
export async function revokeAccessLink(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  if (!userId) throw new Error('userId requerido');
  await prisma.user.update({
    where: { id: userId },
    data: { accessToken: null },
  });
  revalidatePath('/admin/usuarios');
}
