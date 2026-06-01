import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SESSION_COOKIE_SECURE = '__Secure-authjs.session-token';
const SESSION_COOKIE_PLAIN = 'authjs.session-token';

/**
 * GET /entrar/<token>
 * Enlace de acceso permanente. Si el token corresponde a un usuario, crea una
 * sesión NextAuth (fila Session + cookie) y redirige al dashboard. El token NO
 * se consume (es reusable hasta que el admin lo revoque).
 */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const origin = new URL(req.url).origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  const user = await prisma.user.findUnique({
    where: { accessToken: token },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  // Crear sesión DB-backed (30 días) y setear la cookie de NextAuth.
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  const secure = origin.startsWith('https://');
  const cookieName = secure ? SESSION_COOKIE_SECURE : SESSION_COOKIE_PLAIN;

  const res = NextResponse.redirect(`${origin}/`);
  res.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    expires,
  });
  return res;
}
