import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { signAppToken } from '@/lib/jwt';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

const Schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Código de 6 dígitos'),
  name: z.string().max(60).optional(),
  phone: z.string().max(20).optional(),
});

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

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const identifier = IDENT_PREFIX + email;

  // Rate limit: max 10 intentos por hora por email + 30 por IP/hora.
  // Brute force del codigo de 6 digitos requeriria 1M intentos.
  const rl = await rateLimit(`code-verify:email:${email}`, 10, 3600);
  if (!rl.allowed) return tooManyRequests(rl.resetAt);
  const rlIp = await rateLimit(`code-verify:ip:${clientIp(req)}`, 30, 3600);
  if (!rlIp.allowed) return tooManyRequests(rlIp.resetAt);

  const expected = hashCode(parsed.data.code);

  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token: expected, expires: { gt: new Date() } },
  });
  if (!record) {
    return NextResponse.json(
      { error: 'Código incorrecto o expirado' },
      { status: 401 },
    );
  }

  // Consumir el token (un solo uso)
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  // Upsert del usuario. name/phone solo se guardan en primer registro
  // o si el usuario aún no los tenía (no sobrescriben).
  const existing = await prisma.user.findUnique({ where: { email } });
  let user;
  if (!existing) {
    user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name ?? null,
        phone: parsed.data.phone ?? null,
        emailVerified: new Date(),
      },
    });
  } else {
    user = existing;
    const wantsName = parsed.data.name && !existing.name;
    const wantsPhone = parsed.data.phone && !existing.phone;
    if (wantsName || wantsPhone || !existing.emailVerified) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: wantsName ? parsed.data.name : existing.name,
          phone: wantsPhone ? parsed.data.phone : existing.phone,
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

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPaid: user.hasPaid,
    },
  });
}
