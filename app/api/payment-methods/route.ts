import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payment-methods — público.
 * Devuelve los métodos de pago activos. Consumido por web/app inscripción.
 *
 * El admin los configura en /admin/pagos. Si no hay ninguno activo,
 * la app muestra un empty-state.
 */
export async function GET() {
  const methods = await prisma.paymentMethod.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      type: true,
      title: true,
      subtitle: true,
      icon: true,
      fields: true,
    },
  });
  return NextResponse.json({ methods });
}
