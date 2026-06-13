import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';

const schema = z.object({
  // Expo devuelve el token como "ExponentPushToken[xxxx]" (con "Exponent").
  // La validacion antigua exigia "ExpoPushToken[" y rechazaba TODOS los
  // registros con 400 -> 0 dispositivos -> ninguna notificacion llegaba.
  // Aceptamos ambas formas por compatibilidad.
  expoToken: z
    .string()
    .min(10)
    .max(200)
    .refine(
      (t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['),
      { message: 'Formato de token Expo inválido' },
    ),
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().max(20).optional(),
});

/**
 * POST /api/me/push-device
 * Registra (o actualiza) un token Expo push del usuario actual.
 * La app móvil lo llama tras conceder permisos de notificación.
 */
export async function POST(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }
  const { expoToken, platform, appVersion } = parsed.data;

  await prisma.pushDevice.upsert({
    where: { expoToken },
    update: { userId: user.id, platform, appVersion, lastUsedAt: new Date() },
    create: { userId: user.id, expoToken, platform, appVersion },
  });

  return NextResponse.json({ ok: true });
}

/** DELETE — el user desactiva push desde la app. */
export async function DELETE(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'token requerido' }, { status: 400 });
  }

  await prisma.pushDevice.deleteMany({
    where: { expoToken: token, userId: user.id },
  });
  return NextResponse.json({ ok: true });
}
