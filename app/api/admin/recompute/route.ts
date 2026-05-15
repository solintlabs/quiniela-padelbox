import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/permissions';
import { recomputeAll } from '@/lib/sync';

export async function POST(req: Request) {
  const user = await requireAdminApi(req);
  if (user instanceof Response) return user;
  const result = await recomputeAll();
  return NextResponse.json({ ok: true, ...result });
}
