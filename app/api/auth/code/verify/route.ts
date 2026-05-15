import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { signAppToken } from '@/lib/jwt';

const Schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Código de 6 dígitos'),
  name: z.string().max(60).optional(),
});

const IDENT_PREFIX = 'code:';

function hashCode(code: string): string {
  return crypto
    .createHmac('sha256', process.env.AUTH_SECRET ?? 'dev-secret')
    .update(code)
    .digest('hex');
}

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const identifier = IDENT_PREFIX + email;
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

  // Upsert del usuario. Si llega name y el usuario es nuevo o no tenía nombre, lo guardamos.
  const existing = await prisma.user.findUnique({ where: { email } });
  let user;
  if (!existing) {
    user = await prisma.user.create({
      data: { email, name: parsed.data.name ?? null, emailVerified: new Date() },
    });
  } else {
    user = existing;
    const wantsName = parsed.data.name && !existing.name;
    if (wantsName || !existing.emailVerified) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: wantsName ? parsed.data.name : existing.name,
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
