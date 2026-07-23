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
 * El "client secret" de Apple es un JWT ES256 firmado con la key .p8. Caduca
 * (máx 6 meses), así que en vez de guardarlo a mano lo generamos aquí desde
 * los datos en env y lo cacheamos. Se regenera solo — nada que renovar.
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
  return {
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'database' },
    pages: {
      signIn: '/login',
      verifyRequest: '/login/verify',
    },
    providers: [
      Resend({
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
        // HTML personalizado branded
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
      ...(hasGoogle
        ? [
            Google({
              clientId: process.env.GOOGLE_CLIENT_ID!,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
              // Google verifica los emails → seguro vincular al usuario que ya
              // existe con el mismo email. Sin esto: "OAuthAccountNotLinked".
              allowDangerousEmailAccountLinking: true,
            }),
          ]
        : []),
      ...(hasApple
        ? [
            Apple({
              clientId: process.env.AUTH_APPLE_ID!,
              clientSecret: await appleClientSecret(),
              allowDangerousEmailAccountLinking: true,
            }),
          ]
        : []),
    ],
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
