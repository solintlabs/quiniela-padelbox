import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import Resend from 'next-auth/providers/resend';
import { SignJWT, importPKCS8 } from 'jose';
import { prisma } from '@/lib/db';
import { buildMagicLinkEmail } from '@/lib/emails/magic-link';
import type { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      hasPaid: boolean;
    } & DefaultSession['user'];
  }
  interface User {
    role?: Role;
    hasPaid?: boolean;
  }
}

const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const hasApple =
  !!process.env.AUTH_APPLE_ID &&
  !!process.env.APPLE_TEAM_ID &&
  !!process.env.APPLE_KEY_ID &&
  !!process.env.APPLE_PRIVATE_KEY;

/**
 * El "client secret" de Apple es un JWT ES256 firmado con la key .p8. Se genera
 * aquí desde los datos en env y se cachea. Si el .p8 está mal, esto LANZA — por
 * eso el caller lo envuelve en try/catch: un problema de Apple NUNCA debe tumbar
 * el resto del login (Resend + Google).
 */
let appleSecretCache: { jwt: string; exp: number } | null = null;
async function appleClientSecret(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (appleSecretCache && appleSecretCache.exp - now > 3600) return appleSecretCache.jwt;
  const pem = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const key = await importPKCS8(pem, 'ES256');
  const exp = now + 60 * 60 * 24 * 120; // 120 días
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID! })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setAudience('https://appleid.apple.com')
    .setSubject(process.env.AUTH_APPLE_ID!)
    .sign(key);
  appleSecretCache = { jwt, exp };
  return jwt;
}

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const providers: NextAuthConfig['providers'] = [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
      async sendVerificationRequest({ identifier: to, url, provider }) {
        const origin = new URL(url).origin;
        const { subject, html, text } = buildMagicLinkEmail({ url, origin });
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from: provider.from, to, subject, html, text }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Resend error ${res.status}: ${body}`);
        }
      },
    }),
  ];

  if (hasGoogle) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        // Google verifica los emails → seguro vincular al usuario que ya existe.
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  // Apple aislado: si el secret falla (p.ej. .p8 mal pegado), se salta y el
  // resto del login sigue funcionando. Nunca tumba la auth.
  if (hasApple) {
    try {
      const clientSecret = await appleClientSecret();
      providers.push(
        Apple({
          clientId: process.env.AUTH_APPLE_ID!,
          clientSecret,
          allowDangerousEmailAccountLinking: true,
        }),
      );
    } catch (e) {
      console.error(
        '[auth] Sign in with Apple deshabilitado (secret inválido):',
        e instanceof Error ? e.message : e,
      );
    }
  }

  return {
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'database' },
    pages: {
      signIn: '/login',
      verifyRequest: '/login/verify',
    },
    providers,
    callbacks: {
      async session({ session, user }) {
        if (session.user && user) {
          session.user.id = user.id;
          session.user.role = (user as { role?: Role }).role ?? 'USER';
          session.user.hasPaid = (user as { hasPaid?: boolean }).hasPaid ?? false;
        }
        return session;
      },
    },
  } satisfies NextAuthConfig;
});
