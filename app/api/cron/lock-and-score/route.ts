import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/permissions';
import { lockAndScore } from '@/lib/sync';

export async function GET(req: Request) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;
  const result = await lockAndScore();
  return NextResponse.json({ ok: true, ...result });
}

export const POST = GET;
