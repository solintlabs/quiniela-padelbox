import { NextResponse } from 'next/server';
import { requireUserApi } from '@/lib/permissions';
import { computeRanking } from '@/lib/ranking';

export async function GET() {
  const user = await requireUserApi();
  if (user instanceof Response) return user;

  const ranking = await computeRanking();
  return NextResponse.json({ ranking, meId: user.id });
}
