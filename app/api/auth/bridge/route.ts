import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUserApi } from '@/lib/permissions';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

/**
 * POST /api/auth/bridge — puente de sesión app→web.
 *
 * La app (autenticada por JWT) pide una URL de un solo uso que abre el
 * navegador YA LOGUEADO como el mismo usuario. Sin esto, "Subir a Pro" o
 * "Panel completo" aterrizaban en un navegador sin sesión (o con otra
 * cuenta) y el panel respondía 404.
 *
 * El token: aleatorio, hasheado en DB (VerificationToken), caduca en 2
 * minutos y se consume al primer uso.
 */
export const dynamic = 'force-dynamic';

const Schema = z.object({
  /** Ruta destino DENTRO del sitio (p. ej. /saas/mi-club/panel). */
  next: z.string().regex(/^\/(?!\/)[^\s]*$/, 'Ruta inválida').max(300).optional(),
});

function hashToken(raw: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET no configurado');
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

export async function POST(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const rl = await rateLimit(`bridge:${user.id}`, 10, 600);
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const raw = crypto.randomBytes(32).toString('base64url');
  await prisma.verificationToken.create({
    data: {
      identifier: `bridge:${user.id}`,
      token: hashToken(raw),
      expires: new Date(Date.now() + 2 * 60 * 1000),
    },
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quinielabox.com';
  const next = parsed.data.next ? `?next=${encodeURIComponent(parsed.data.next)}` : '';
  return NextResponse.json({ url: `${site}/entrar-app/${raw}${next}` });
}
