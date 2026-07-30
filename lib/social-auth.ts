import { createRemoteJWKSet, jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { signAppToken } from '@/lib/jwt';

/**
 * Login social de la APP MÓVIL (Sign in with Apple / Google).
 *
 * La app obtiene el identity token nativo y lo manda aquí; se verifica su
 * firma contra las JWKS públicas del proveedor y se emite el MISMO JWT de
 * la app que emite el flujo OTP. La web no usa esto (tiene NextAuth).
 *
 * A diferencia del OTP, aquí NO aplica el cierre de inscripciones de
 * PADELBOX: quien entra con Google/Apple viene por el SaaS multi-tenant
 * (crear o unirse a quinielas), no por la quiniela del club.
 */

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

/** Bundle id de la app iOS — audience de los tokens de Apple. */
const APPLE_AUDIENCE = 'cloud.solint.quinielapadelbox';

/** Client IDs de Google aceptados (iOS/Android/web), separados por coma. */
function googleAudiences(): string[] {
  const raw = process.env.GOOGLE_MOBILE_CLIENT_IDS ?? process.env.GOOGLE_CLIENT_ID ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface SocialIdentity {
  email: string;
  emailVerified: boolean;
  name: string | null;
}

export class SocialAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function verifyAppleIdentityToken(identityToken: string): Promise<SocialIdentity> {
  let payload;
  try {
    ({ payload } = await jwtVerify(identityToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: APPLE_AUDIENCE,
    }));
  } catch {
    throw new SocialAuthError('Token de Apple inválido o caducado.', 401);
  }
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
  if (!email) {
    // Pasa si el usuario revocó el acceso al email: que entre por código.
    throw new SocialAuthError(
      'Apple no compartió tu email. Entra con tu correo y el código de 6 dígitos.',
      422,
    );
  }
  return {
    email,
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    name: null, // Apple solo da el nombre en el flujo nativo; llega aparte en el body.
  };
}

export async function verifyGoogleIdToken(idToken: string): Promise<SocialIdentity> {
  const audiences = googleAudiences();
  if (audiences.length === 0) {
    throw new SocialAuthError('Login con Google no configurado en el servidor.', 501);
  }
  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: audiences,
    }));
  } catch {
    throw new SocialAuthError('Token de Google inválido o caducado.', 401);
  }
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
  if (!email) throw new SocialAuthError('Google no devolvió un email.', 422);
  return {
    email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === 'string' ? payload.name : null,
  };
}

/**
 * Busca o crea el User y emite el JWT de la app — espejo del flujo OTP:
 * el nombre solo se guarda si el usuario no tenía.
 */
export async function issueTokenFor(
  identity: SocialIdentity,
  nameFromClient?: string,
): Promise<{ token: string; user: { id: string; email: string; name: string | null; role: 'USER' | 'ADMIN'; hasPaid: boolean } }> {
  const name = (nameFromClient?.trim() || identity.name || '').slice(0, 60) || null;

  const existing = await prisma.user.findUnique({ where: { email: identity.email } });
  let user;
  if (!existing) {
    user = await prisma.user.create({
      data: { email: identity.email, name, emailVerified: new Date() },
    });
  } else {
    user = existing;
    if ((name && !existing.name) || !existing.emailVerified) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: existing.name ?? name,
          emailVerified: existing.emailVerified ?? new Date(),
        },
      });
    }
  }

  const token = await signAppToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    hasPaid: user.hasPaid,
  });
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, hasPaid: user.hasPaid },
  };
}
