import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/permissions';
import { syncMatchesFromApi } from '@/lib/sync';

export async function GET(req: Request) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;
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

export const POST = GET;
