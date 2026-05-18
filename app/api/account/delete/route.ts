import { NextResponse } from 'next/server';
import { requireUserApi } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export async function DELETE(req: Request) {
  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  // Cascades via schema: Account, Session, Prediction, PushDevice
  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
