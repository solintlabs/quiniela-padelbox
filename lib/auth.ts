import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
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

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      // HTML personalizado branded PADELBOX
      async sendVerificationRequest({ identifier: to, url, provider }) {
        const origin = new URL(url).origin;
        const { subject, html, text } = buildMagicLinkEmail({ url, origin });

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to,
            subject,
            html,
            text,
          }),
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
});
