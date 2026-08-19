import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';
import { SocialAuthError, issueTokenFor, verifyGoogleIdToken } from '@/lib/social-auth';

/**
 * POST /api/auth/social/google — Google Sign-In de la app móvil.
 * Body: { idToken, name? }. El audience aceptado sale de
 * GOOGLE_MOBILE_CLIENT_IDS (coma-separado) o GOOGLE_CLIENT_ID.
 */
export const dynamic = 'force-dynamic';

const Schema = z.object({
  idToken: z.string().min(20),
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
    const identity = await verifyGoogleIdToken(parsed.data.idToken);
    const result = await issueTokenFor(identity, parsed.data.name);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof SocialAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[auth/social/google]', e);
    return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 500 });
  }
}
