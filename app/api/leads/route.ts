import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(60).optional(),
  clubName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  expectedSize: z.number().int().positive().max(100000).optional(),
  source: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(500).optional(),
});

/**
 * POST /api/leads — captura de interés "quiero mi quiniela".
 * Público (no requiere login) pero rate-limited por IP + email.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const rlEmail = await rateLimit(`lead:email:${email}`, 3, 3600);
  if (!rlEmail.allowed) return tooManyRequests(rlEmail.resetAt);
  const rlIp = await rateLimit(`lead:ip:${ip}`, 10, 3600);
  if (!rlIp.allowed) return tooManyRequests(rlIp.resetAt);

  await prisma.lead.create({
    data: {
      email,
      name: parsed.data.name ?? null,
      clubName: parsed.data.clubName ?? null,
      phone: parsed.data.phone ?? null,
      expectedSize: parsed.data.expectedSize ?? null,
      source: parsed.data.source ?? 'unknown',
      notes: parsed.data.notes ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
