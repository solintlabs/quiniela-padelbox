import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/permissions';
import { lockAndScore } from '@/lib/sync';

// lockAndScore puede tardar: sync interno + scoring de varios matches + push.
// Subimos a 45s para tener margen (Hobby max 60s).
export const maxDuration = 45;

export async function GET(req: Request) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;
  try {
    const result = await lockAndScore();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron/lock-and-score] failed:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'lock-and-score failed' },
      { status: 200 },
    );
  }
}

export const POST = GET;
