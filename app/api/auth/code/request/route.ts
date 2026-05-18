import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { buildLoginCodeEmail } from '@/lib/emails/login-code';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';
import { APPLE_REVIEW_CODE, isAppleReviewEmail } from '@/lib/apple-review';

const Schema = z.object({ email: z.string().email() });

const CODE_TTL_MIN = 10;
const IDENT_PREFIX = 'code:';

function hashCode(code: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET no configurado');
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function generateCode(): string {
  // 6 dígitos, primero distinto de 0
  return String(crypto.randomInt(100000, 1_000_000));
}

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const identifier = IDENT_PREFIX + email;

  // Bypass cuenta demo Apple Review: codigo fijo, sin rate limit, sin Resend.
  if (isAppleReviewEmail(email)) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: {
        identifier,
        token: hashCode(APPLE_REVIEW_CODE),
        expires: new Date(Date.now() + CODE_TTL_MIN * 60_000),
      },
    });
    return NextResponse.json({ ok: true });
  }

  // Rate limit: max 5 emails de codigo por hora a cada direccion +
  // max 20 por hora por IP (anti-spam masivo).
  const rl = await rateLimit(`code-req:email:${email}`, 5, 3600);
  if (!rl.allowed) return tooManyRequests(rl.resetAt);
  const rlIp = await rateLimit(`code-req:ip:${clientIp(req)}`, 20, 3600);
  if (!rlIp.allowed) return tooManyRequests(rlIp.resetAt);

  // Borrar códigos previos para este email
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const code = generateCode();
  const token = hashCode(code);
  const expires = new Date(Date.now() + CODE_TTL_MIN * 60_000);

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  // Enviar email vía Resend
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service no configurado' }, { status: 500 });
  }

  const origin = new URL(req.url).origin;
  const { subject, html, text } = buildLoginCodeEmail({ code, origin });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: email,
      reply_to: process.env.EMAIL_REPLY_TO ?? 'info@solint.cloud',
      subject,
      html,
      text,
    }),
  });

  if (!r.ok) {
    const body = await r.text().catch(() => '');
    console.error('[auth/code/request] Resend error:', r.status, body);
    return NextResponse.json({ error: 'No se pudo enviar el email' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
