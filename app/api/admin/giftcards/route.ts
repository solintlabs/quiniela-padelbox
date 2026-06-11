import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminApi } from '@/lib/permissions';

// Sin 0/O/1/I/L para que el local pueda teclearlo sin ambigüedad.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function genCode(): string {
  const bytes = randomBytes(8);
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `QB-${s.slice(0, 4)}-${s.slice(4)}`;
}

const bodySchema = z.object({
  monto: z.string().trim().min(1).max(28),
  titulo: z.string().trim().max(36).optional(),
  detalle: z.string().trim().max(48).optional(),
  sponsorName: z.string().trim().max(60).optional(),
  winnerName: z.string().trim().max(32).optional(),
});

/** Emite una gift card: crea el registro y devuelve el código único. */
export async function POST(req: Request) {
  const admin = await requireAdminApi(req);
  if (admin instanceof Response) return admin;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const b = parsed.data;

  // Reintenta si colisiona el código único (probabilidad ínfima).
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const card = await prisma.giftCard.create({
        data: {
          code: genCode(),
          monto: b.monto,
          titulo: b.titulo || null,
          detalle: b.detalle || null,
          sponsorName: b.sponsorName || null,
          winnerName: b.winnerName || null,
        },
      });
      return NextResponse.json({ code: card.code, id: card.id });
    } catch (e) {
      const isUniqueClash =
        typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === 'P2002';
      if (!isUniqueClash) throw e;
    }
  }
  return NextResponse.json({ error: 'No se pudo generar un código único' }, { status: 500 });
}
