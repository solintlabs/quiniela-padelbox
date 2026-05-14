import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/permissions';
import { syncMatchesFromApi } from '@/lib/sync';

export async function POST() {
  const user = await requireAdminApi();
  if (user instanceof Response) return user;
  try {
    const result = await syncMatchesFromApi();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'sync failed' },
      { status: 500 },
    );
  }
}
