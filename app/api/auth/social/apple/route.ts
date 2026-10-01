import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';
import { SocialAuthError, issueTokenFor, verifyAppleIdentityToken } from '@/lib/social-auth';

/**
 * POST /api/auth/social/apple — Sign in with Apple de la app iOS.
 * Body: { identityToken, name? }. El nombre solo llega la PRIMERA vez que el
 * usuario autoriza (así funciona Apple), por eso viaja aparte del token.
 */
export const dynamic = 'force-dynamic';

const Schema = z.object({
  identityToken: z.string().min(20),
  name: z.string().max(120).optional(),
});

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: Request) {
  const rl = await rateLimit(`social:ip:${clientIp(req)}`, 20, 3600);
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  try {
    const identity = await verifyAppleIdentityToken(parsed.data.identityToken);
    const result = await issueTokenFor(identity, parsed.data.name);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof SocialAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[auth/social/apple]', e);
    return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 500 });
  }
}
