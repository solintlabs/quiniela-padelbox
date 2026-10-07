import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';

/**
 * GET /entrar-app/<token>?next=/ruta
 *
 * Consume el token de un solo uso emitido por POST /api/auth/bridge, crea la
 * sesión NextAuth (fila Session + cookie, igual que /entrar/[token] de los
 * access links) y redirige a `next`. Caducado o ya usado → /login.
 */
export const dynamic = 'force-dynamic';

const SESSION_COOKIE_SECURE = '__Secure-authjs.session-token';
const SESSION_COOKIE_PLAIN = 'authjs.session-token';

function hashToken(raw: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET no configurado');
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

export async function GET(req: Request, ctx: { params: { token: string } }) {
  const { token } = ctx.params;
  const url = new URL(req.url);
  const origin = url.origin;
  const nextParam = url.searchParams.get('next') ?? '/mis-quinielas';
  // Solo rutas internas: nada de redirigir a dominios ajenos.
  const next = /^\/(?!\/)/.test(nextParam) ? nextParam : '/mis-quinielas';

  if (!token) return NextResponse.redirect(`${origin}/login`);

  const hashed = hashToken(token);
  const record = await prisma.verificationToken.findFirst({
    where: {
      token: hashed,
      identifier: { startsWith: 'bridge:' },
      expires: { gt: new Date() },
    },
  });
  if (!record) return NextResponse.redirect(`${origin}/login?error=bridge`);

  // Un solo uso.
  await prisma.verificationToken.deleteMany({
    where: { identifier: record.identifier, token: hashed },
  });

  const userId = record.identifier.slice('bridge:'.length);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return NextResponse.redirect(`${origin}/login?error=bridge`);

  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

  const secure = origin.startsWith('https://');
  const res = NextResponse.redirect(`${origin}${next}`);
  res.cookies.set(secure ? SESSION_COOKIE_SECURE : SESSION_COOKIE_PLAIN, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    expires,
  });
  return res;
}
