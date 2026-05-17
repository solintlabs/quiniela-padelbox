import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sponsors — público.
 * Devuelve los sponsors activos ordenados (los "aliados comerciales").
 * Consumido por dashboard web y app móvil.
 */
export async function GET() {
  const sponsors = await prisma.sponsor.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, logoUrl: true, url: true },
  });
  return NextResponse.json({ sponsors });
}
